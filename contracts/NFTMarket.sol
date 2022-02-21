// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "hardhat/console.sol";

contract NFTMarket is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable itemOwner;
    uint256 listingPrice = 0.025 ether;

    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;
    // Declare a set state variable
    EnumerableSet.AddressSet private erc20TokensSet;

    constructor(address[] memory _tokensList) {
        itemOwner = payable(msg.sender);
        // supported tokens for accepting payment
        manageTokens(_tokensList, true);
    }

    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable itemOwner;
        uint256 price;
        bool sold;
        address[] _buySupportedTokensList;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    mapping(address => address) public tokenPriceFeedMapping;

    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address itemOwner,
        uint256 price,
        bool sold,
        address[] _buySupportedTokensList
    );

    /* Returns the listing price of the contract */
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /* Places an item for sale on the marketplace */
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        bool is721,
        address[] memory _buySupportedTokensList
    ) public payable nonReentrant {
        console.log(
            "contract balance before creating: ",
            address(this).balance
        );
        require(price > 0, "Price must be at least 1 wei");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );
        for (
            uint256 index = 0;
            index < _buySupportedTokensList.length;
            index++
        ) {
            require(
                (erc20TokensSet.contains(_buySupportedTokensList[index])),
                "not a valid buy token - buy"
            );
        }

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            _buySupportedTokensList
        );

        if (is721) {
            IERC721(nftContract).transferFrom(
                msg.sender,
                address(this),
                tokenId
            );
        } else {
            IERC1155(nftContract).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId,
                1,
                ""
            );
        }

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false,
            _buySupportedTokensList
        );
        console.log(
            "contract balance after creating : ",
            address(this).balance
        );
    }

    /* Creates the sale of a marketplace item */
    /* Transfers itemOwnership of the item, as well as funds between parties */
    function createMarketSale(
        address nftContract,
        uint256 itemId,
        bool is721,
        uint256 _askingAmount,
        address _buyTokenType
    ) public payable nonReentrant {
        bool isValidBuyToken;
        uint256 price = idToMarketItem[itemId].price;
        //check valid _buySupportedToken
        if (msg.value == 0 && _askingAmount != 0) {
            // ERC20 Payment
            require(address(_buyTokenType) != address(0), "0x address");

            for (
                uint256 index = 0;
                index < idToMarketItem[itemId]._buySupportedTokensList.length;
                index++
            ) {
                console.log("_buyTokenType tokens: ", _buyTokenType);
                console.log(
                    "item tokens i :       ",
                    idToMarketItem[itemId]._buySupportedTokensList[index]
                );
                if (
                    idToMarketItem[itemId]._buySupportedTokensList[index] ==
                    _buyTokenType
                ) {
                    isValidBuyToken = true;
                    break;
                }
            }

            console.log("_buyTokenType isValidBuyToken: ", isValidBuyToken);
            require(isValidBuyToken, "not a valid buy token - sell");

            // TODO verify _askingAmount with item price?

            // if (price <= 0) {
            //     return 0;
            // }
            // price of the token * stakingBalance[_token][user]
            (uint256 latrstPrice, uint256 decimals) = getTokenValue(_buyTokenType);
            // 10000000000000000000 ETH
            // ETH/USD -> 10000000000
            // 10 * 100 = 1,000
            uint256 calculatedPrice = ((price * latrstPrice) / (10**decimals));
            console.log('calculatedPice: ', calculatedPrice);
            console.log('_askingAmount : ', _askingAmount);

            require(
                _askingAmount == calculatedPrice,
                "Please submit the asking calculatedPrice in order to complete the purchase"
            );
            require(
                ERC20(_buyTokenType).allowance(msg.sender, address(this)) >=
                    calculatedPrice,
                "Tokens are not approved."
            );
            require(
                ERC20(_buyTokenType).balanceOf(msg.sender) >= calculatedPrice,
                "Insufficient token balance"
            );

            ERC20(_buyTokenType).transferFrom(
                msg.sender,
                idToMarketItem[itemId].seller,
                calculatedPrice
            );
        } else if (msg.value != 0 && _askingAmount == 0) {
            // Native Currency payment
            // TODO price/balance/token validation
            require(
                msg.value == price,
                "Please submit the asking price in order to complete the purchase"
            );
            console.log("caller                    : ", msg.sender);
            console.log("contract                  : ", address(this));
            console.log("value                  : ", msg.value);
            console.log("contract balance before: ", address(this).balance);
            console.log(
                "balance seller before: ",
                idToMarketItem[itemId].seller.balance
            );
            idToMarketItem[itemId].seller.transfer(msg.value);
            console.log("contract balance after : ", address(this).balance);
            console.log(
                "balance seller after : ",
                idToMarketItem[itemId].seller.balance
            );
        } else {
            require(
                false,
                "payment can only be accepted in either native or ERC20"
            );
        }

        uint256 tokenId = idToMarketItem[itemId].tokenId;

        if (is721) {
            IERC721(nftContract).transferFrom(
                address(this),
                msg.sender,
                tokenId
            );
        } else {
            IERC1155(nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                1,
                ""
            );
            onERC1155Received(msg.sender, address(this), tokenId, 1, "");
        }
        idToMarketItem[itemId].itemOwner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        // TODO check contract holding this... move somewhere
        // payable(itemOwner).transfer(listingPrice);
    }

    /* Returns all unsold market items */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].itemOwner == address(0)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    /* Returns only items that a user has purchased 
  i.e itemOwner == msg.sender 
  */
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].itemOwner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].itemOwner == msg.sender) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    /* Returns only items a user has created 
  i.e 
  seller == msg.sender 
  */
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    /** contract will return a response to the external contracts that your contract supports erc721 and erc1155 tokens.
    The safeTransfer will automatically search for onERC1155Received function
    */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function addTokens(address[] memory _tokensList) external onlyOwner {
        manageTokens(_tokensList, true);
    }

    function manageTokens(address[] memory _tokensList, bool _isAddition)
        internal
    {
        if (_isAddition) {
            for (uint256 index = 0; index < _tokensList.length; index++) {
                if (!erc20TokensSet.contains(_tokensList[index])) {
                    erc20TokensSet.add(_tokensList[index]);
                }
            }
        } else {
            for (uint256 index = 0; index < _tokensList.length; index++) {
                if (erc20TokensSet.contains(_tokensList[index])) {
                    erc20TokensSet.remove(_tokensList[index]);
                }
            }
        }
    }

    function removeTokens(address[] memory _tokensList) external onlyOwner {
        manageTokens(_tokensList, false);
    }

    function getTokenList() public view returns (address[] memory) {
        address[] memory allTokens = new address[](erc20TokensSet.length());

        for (uint256 index = 0; index < erc20TokensSet.length(); index++) {
            allTokens[index] = erc20TokensSet.at(index);
        }
        return allTokens;
    }

    function setPriceFeedContract(address _token, address _priceFeed)
        public
        onlyOwner
    {
        tokenPriceFeedMapping[_token] = _priceFeed;
    }

    function getTokenValue(address _token)
        public
        view
        returns (uint256, uint256)
    {
        // priceFeedAddress
        address priceFeedAddress = tokenPriceFeedMapping[_token];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            priceFeedAddress
        );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        uint256 decimals = uint256(priceFeed.decimals());
        return (uint256(price), decimals);
    }
}
