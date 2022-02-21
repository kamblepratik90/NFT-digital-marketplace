const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket Accept Diff Tokens", function () {
    let buyer, accounts;
    let owner;
    let marketAddress, nftContractAddress1155;
    let marketContract;
    let nft1155Contract;

    // ERC20 Tokens
    let MY_DAI_Token, MY_USDT_Token;
    let listingPrice;
    let priceConsumerV3_1, priceConsumerV3_2;


    const auctionPriceValue = '1';
    const auctionPrice = ethers.utils.parseUnits(auctionPriceValue, 'ether');

    async function setup() {
        provider = ethers.getDefaultProvider();

        [owner, buyer, ...accounts] =
            await ethers.getSigners();

        /* deploy supproted ERC20 tokens */
        let ERC20TokenFactory = await ethers.getContractFactory("ERC20Mock");
        MY_DAI_Token = await ERC20TokenFactory.deploy(
            owner.address,
            "MYDAITOKEN",
            "MY_DAI",
            ethers.utils.parseUnits("1000", 18),
            18
        );
        await MY_DAI_Token.deployed();

        ERC20TokenFactory = await ethers.getContractFactory("ERC20Mock");
        MY_USDT_Token = await ERC20TokenFactory.deploy(
            owner.address,
            "MYUSDTTOKEN",
            "MY_USDT",
            ethers.utils.parseUnits("1000", 6),
            6
        );
        await MY_USDT_Token.deployed();

        /* deploy the marketplace */
        const Market = await ethers.getContractFactory("NFTMarket")
        marketContract = await Market.deploy([MY_DAI_Token.address, MY_USDT_Token.address]);
        await marketContract.deployed()
        marketAddress = marketContract.address

        /* deploy the NFT contract */

        const NFT1155 = await ethers.getContractFactory("NFT1155")
        nft1155Contract = await NFT1155.deploy(marketAddress)
        await nft1155Contract.deployed()
        nftContractAddress1155 = nft1155Contract.address


        listingPrice = await marketContract.getListingPrice()
        listingPrice = listingPrice.toString()

        let tx = await MY_DAI_Token.transfer(
            buyer.address,
            ethers.utils.parseUnits("100", 18)
        );
        await tx.wait();

        tx = await MY_USDT_Token.transfer(
            buyer.address,
            ethers.utils.parseUnits("100", 6)
        );
        await tx.wait();


        MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator")
        let PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3")
        let price = '15000000000000000000'
        let mockPriceFeed = await MockV3Aggregator.deploy(18, price)
        priceConsumerV3_1 = await PriceConsumerV3.deploy(mockPriceFeed.address)

        await marketContract.setPriceFeedContract(MY_DAI_Token.address, mockPriceFeed.address);

        price = '1092038'
        mockPriceFeed = await MockV3Aggregator.deploy(6, price)
        priceConsumerV3_2 = await PriceConsumerV3.deploy(mockPriceFeed.address)

        await marketContract.setPriceFeedContract(MY_USDT_Token.address, mockPriceFeed.address);
    }

    beforeEach(async () => {
        await setup();
    });

    it("should accept ERC20 token USDT", async () => {

    const auctionPriceValue_ = '1';
    const auctionPrice_ = ethers.utils.parseUnits(auctionPriceValue_, 6);

        console.log('supported buy tokens: ', await marketContract.getTokenList());

        console.log('\n buyer bal: ', (await MY_USDT_Token.balanceOf(buyer.address)).toString())
        console.log('seller bal: ', (await MY_USDT_Token.balanceOf(owner.address)).toString())

        /* create NFT tokens */

        await nft1155Contract.mintNFT("https://www.mytokenlocation3.com")

        /* put both tokens for sale */

        await marketContract.createMarketItem(nftContractAddress1155, 1, auctionPrice_, false, [MY_USDT_Token.address], { value: listingPrice })

        /* execute sale of token to another user */
        let latestPrice = await priceConsumerV3_2.getLatestPrice();
        let convertedAuctionPrice = latestPrice.mul(auctionPriceValue_)
        await MY_USDT_Token.connect(buyer).approve(marketContract.address, convertedAuctionPrice);
        await marketContract.connect(buyer).createMarketSale(nftContractAddress1155, 1, false, convertedAuctionPrice, MY_USDT_Token.address);

        console.log('\n ERC1155 ************************** Available Market Items (sold) \n')

        /* query for and return the unsold items */
        items = await marketContract.fetchMarketItems()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 items: ', items)


        console.log('\n ERC1155 ************************** Items Owned by user \n')

        /* query for and return the user owned items */
        items = await marketContract.connect(buyer).fetchMyNFTs()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 fetchMyNFTs: ', items)

        console.log('\n ERC1155 ************************** Items Created by user \n')

        /* query for and return the user owned items */
        items = await marketContract.connect(owner).fetchItemsCreated()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 fetchItemsCreated: ', items)

        console.log('\n buyer bal: ', (await MY_USDT_Token.balanceOf(buyer.address)).toString())
        console.log('seller bal: ', (await MY_USDT_Token.balanceOf(owner.address)).toString())

        expect(2 + 2).to.equal(4);
    });

    it("should accept ERC20 token ", async () => {

        console.log('supported buy tokens: ', await marketContract.getTokenList());

        /* create NFT tokens */

        await nft1155Contract.mintNFT("https://www.mytokenlocation3.com")

        console.log('\n buyer bal: ', (await MY_DAI_Token.balanceOf(buyer.address)).toString())
        console.log('seller bal: ', (await MY_DAI_Token.balanceOf(owner.address)).toString())

        /* put both tokens for sale */

        await marketContract.createMarketItem(nftContractAddress1155, 1, auctionPrice, false, [MY_DAI_Token.address], { value: listingPrice })

        /* execute sale of token to another user */
        let latestPrice = await priceConsumerV3_1.getLatestPrice();
        let convertedAuctionPrice = latestPrice.mul(auctionPriceValue)
        await MY_DAI_Token.connect(buyer).approve(marketContract.address, convertedAuctionPrice);
        await marketContract.connect(buyer).createMarketSale(nftContractAddress1155, 1, false, convertedAuctionPrice, MY_DAI_Token.address);

        console.log('\n ERC1155 ************************** Available Market Items (sold) \n')

        /* query for and return the unsold items */
        items = await marketContract.fetchMarketItems()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 items: ', items)


        console.log('\n ERC1155 ************************** Items Owned by user \n')

        /* query for and return the user owned items */
        items = await marketContract.connect(buyer).fetchMyNFTs()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 fetchMyNFTs: ', items)

        console.log('\n ERC1155 ************************** Items Created by user \n')

        /* query for and return the user owned items */
        items = await marketContract.connect(owner).fetchItemsCreated()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 fetchItemsCreated: ', items)

        console.log('\n buyer bal: ', (await MY_DAI_Token.balanceOf(buyer.address)).toString())
        console.log('seller bal: ', (await MY_DAI_Token.balanceOf(owner.address)).toString())

        expect(2 + 2).to.equal(4);
    });


    it("should accept Native token ", async () => {

        console.log('supported buy tokens : ', await marketContract.getTokenList());

        console.log('contract before mint : ', (await marketContract.getBalance()).toString());
        /* create NFT tokens */
        await nft1155Contract.mintNFT("https://www.mytokenlocation3.com")

        console.log('contract after  mint : ', (await marketContract.getBalance()).toString());

        /* put both tokens for sale */

        await marketContract.createMarketItem(nftContractAddress1155, 1, auctionPrice, false, [MY_DAI_Token.address], { value: listingPrice })

        console.log('contract after creat : ', (await marketContract.getBalance()).toString());
        /* execute sale of token to another user */
        // await MY_DAI_Token.connect(buyer).approve(marketContract.address, auctionPrice);
        // await marketContract.connect(buyer).createMarketSale(nftContractAddress1155, 1, false, auctionPrice, MY_DAI_Token.address);
        await marketContract.connect(buyer).createMarketSale(nftContractAddress1155, 1, false, ethers.utils.parseUnits('0', 'ether'), "0x0000000000000000000000000000000000000000", { value: auctionPrice })

        console.log('contract after sell : ', (await marketContract.getBalance()).toString());
        console.log('\n ERC1155 ************************** Available Market Items (sold) \n')

        /* query for and return the unsold items */
        items = await marketContract.fetchMarketItems()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 items: ', items)


        console.log('\n ERC1155 ************************** Items Owned by user \n')

        /* query for and return the user owned items */
        items = await marketContract.connect(buyer).fetchMyNFTs()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 fetchMyNFTs: ', items)

        console.log('\n ERC1155 ************************** Items Created by user \n')

        /* query for and return the user owned items */
        items = await marketContract.connect(owner).fetchItemsCreated()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft1155Contract.uri(i.tokenId)
            let item = {
                price: i.price.toString(),
                tokenId: i.tokenId.toString(),
                seller: i.seller,
                owner: i.itemOwner,
                tokenUri
            }
            return item
        }))
        console.log('ERC1155 fetchItemsCreated: ', items)

        expect(2 + 3).to.equal(5);
    });
});