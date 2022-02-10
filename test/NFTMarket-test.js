/* test/sample-test.js */
describe("NFTMarket", function() {
    it("Should create and execute market sales ERC1155", async function() {
      /* deploy the marketplace */
      const Market = await ethers.getContractFactory("NFTMarket")
      const market = await Market.deploy()
      await market.deployed()
      const marketAddress = market.address
  
      /* deploy the NFT contract */

      const NFT1155 = await ethers.getContractFactory("NFT1155")
      const nft1155 = await NFT1155.deploy(marketAddress)
      await nft1155.deployed()
      const nftContractAddress1155 = nft1155.address
  
      let listingPrice = await market.getListingPrice()
      listingPrice = listingPrice.toString()
  
      const auctionPrice = ethers.utils.parseUnits('1', 'ether')
  
      /* create two tokens */

      await nft1155.mintNFT("https://www.mytokenlocation3.com")
      await nft1155.mintNFT("https://www.mytokenlocation4.com")
  
      /* put both tokens for sale */
      await market.createMarketItem(nftContractAddress1155, 1, auctionPrice, false, { value: listingPrice })
      await market.createMarketItem(nftContractAddress1155, 2, auctionPrice, false, { value: listingPrice })

  
      const [_, buyerAddress] = await ethers.getSigners()
  
      /* execute sale of token to another user */
      await market.connect(buyerAddress).createMarketSale(nftContractAddress1155, 1, false, { value: auctionPrice})
  
      console.log('\n ERC1155 ************************** Available Market Items (sold) \n')

      /* query for and return the unsold items */
      items = await market.fetchMarketItems()
      items = await Promise.all(items.map(async i => {
        const tokenUri = await nft1155.uri(i.tokenId)
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri
        }
        return item
      }))
      console.log('ERC1155 items: ', items)


      console.log('\n ERC1155 ************************** Items Owned by user \n')

      /* query for and return the user owned items */
      items = await market.connect(buyerAddress).fetchMyNFTs()
      items = await Promise.all(items.map(async i => {
        const tokenUri = await nft1155.uri(i.tokenId)
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri
        }
        return item
      }))
      console.log('ERC1155 fetchMyNFTs: ', items)

      console.log('\n ERC1155 ************************** Items Created by user \n')

      /* query for and return the user owned items */
      items = await market.connect(_).fetchItemsCreated()
      items = await Promise.all(items.map(async i => {
        const tokenUri = await nft1155.uri(i.tokenId)
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri
        }
        return item
      }))
      console.log('ERC1155 fetchItemsCreated: ', items)
    })

    it("Should create and execute market sales ERC721", async function() {
      /* deploy the marketplace */
      const Market = await ethers.getContractFactory("NFTMarket")
      const market = await Market.deploy()
      await market.deployed()
      const marketAddress = market.address
  
      /* deploy the NFT contract */
      const NFT = await ethers.getContractFactory("NFT")
      const nft = await NFT.deploy(marketAddress)
      await nft.deployed()
      const nftContractAddress = nft.address

  
      let listingPrice = await market.getListingPrice()
      listingPrice = listingPrice.toString()
  
      const auctionPrice = ethers.utils.parseUnits('1', 'ether')
  
      /* create two tokens */
      await nft.createToken("https://www.mytokenlocation.com")
      await nft.createToken("https://www.mytokenlocation2.com")
  
      /* put both tokens for sale */
      await market.createMarketItem(nftContractAddress, 1, auctionPrice, true, { value: listingPrice })
      await market.createMarketItem(nftContractAddress, 2, auctionPrice, true, { value: listingPrice })
  
      const [_, buyerAddress] = await ethers.getSigners()
  
      /* execute sale of token to another user */
      await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, true, { value: auctionPrice})

      console.log('\n  ERC721 ************************** Available Market Items (sold) \n')

      /* query for and return the unsold items */
      items = await market.fetchMarketItems()
      items = await Promise.all(items.map(async i => {
        const tokenUri = await nft.tokenURI(i.tokenId)
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri
        }
        return item
      }))
      console.log(' ERC721 items: ', items)


      console.log('\n  ERC721 ************************** Items Owned by user \n')

      /* query for and return the user owned items */
      items = await market.connect(buyerAddress).fetchMyNFTs()
      items = await Promise.all(items.map(async i => {
        const tokenUri = await nft.tokenURI(i.tokenId)
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri
        }
        return item
      }))
      console.log(' ERC721 fetchMyNFTs: ', items)

      console.log('\n  ERC721 ************************** Items Created by user \n')

      /* query for and return the user owned items */
      items = await market.connect(_).fetchItemsCreated()
      items = await Promise.all(items.map(async i => {
        const tokenUri = await nft.tokenURI(i.tokenId)
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri
        }
        return item
      }))
      console.log(' ERC721 fetchItemsCreated: ', items)
    })
  })