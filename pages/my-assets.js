/* pages/my-assets.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftmarketaddress, nftaddress, nftaddress1155
} from '../config'

import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFT1155 from '../artifacts/contracts/NFT1155.sol/NFT1155.json'

/**
 * Viewing only the items purchased by the user
In the Market.sol smart contract, we created a function named fetchMyNFTs 
that only returns the items owned by the user.

In pages/my-assets.js, we will use that function to fetch and render them.

This functionality is different than the query main pages/index.js page 
because we need to ask the user for their address and use it in the contract, 
so the user will have to sign the transaction for it to be able to fetch them properly.
 * @returns 
 */
export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    // // ERC721
    // const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    // // ERC1155
    const tokenContract = new ethers.Contract(nftaddress1155, NFT1155.abi, provider)
    const data = await marketContract.fetchMyNFTs()

    const items = await Promise.all(data.map(async i => {
      console.log('my-assets i.tokenId: ', i.tokenId)
      // // ERC721
      // const tokenUri = await tokenContract.tokenURI(i.tokenId)
      // ERC1155
      const tokenUri = await tokenContract.uri(i.tokenId)
      console.log('myassets loadNFTs tokenUri :', tokenUri)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }

  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}