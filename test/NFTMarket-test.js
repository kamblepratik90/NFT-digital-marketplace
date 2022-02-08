/* test/sample-test.js */
describe("NFTMarket", function() {
    it("Should create and execute market sales", async function() {
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
      await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice })
      await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice })
  
      const [_, buyerAddress] = await ethers.getSigners()
  
      /* execute sale of token to another user */
      await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, { value: auctionPrice})
  
      console.log('\n ************************** Available Market Items (sold) \n')

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
      console.log('items: ', items)


      console.log('\n ************************** Items Owned by user \n')

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
      console.log('fetchMyNFTs: ', items)

      console.log('\n ************************** Items Created by user \n')

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
      console.log('fetchItemsCreated: ', items)
    })
  })