/* pages/create-item.js */
import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
  nftaddress, nftmarketaddress, nftaddress1155
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFT1155 from '../artifacts/contracts/NFT1155.sol/NFT1155.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

/**
 * this page allows users to create and list digital assets.

There are a few things happening in this page:

The user is able to upload and save files to IPFS
The user is able to create a new unique digital item (NFT)
The user is able to set metadata and price of item and list it for sale on the marketplace
After the user creates and lists an item, they are re-routed to the main page to view all of the items for sale.
 * @returns 
 */
export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      console.log("file added to IPFS: ", JSON.stringify(added));
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }

  async function createMarket() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      const added = await client.add(data)
      console.log("metaData added to IPFS: ", JSON.stringify(added));
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      createSale(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }

  async function createSale(url) {
    console.log('createSale fileUrl: ', url);
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()

    console.log('signer: ', signer)
    /* next, create the item */
    // // ERC721
    // let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    // let transaction = await contract.createToken(url)
    // ERC1155
    let contract = new ethers.Contract(nftaddress1155, NFT1155.abi, signer)
    let transaction = await contract.mintNFT(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    //  // ERC721
    // let value = event.args[2]
     // ERC1155
    let value = event.args[3]
    let tokenId = value.toNumber()
    console.log('tokenId: ', tokenId);
    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    // transaction = await contract.createMarketItem(nftaddress, tokenId, price, true, { value: listingPrice })
    // transaction = await contract.createMarketItem(nftaddress1155, tokenId, price, false, { value: listingPrice })
    transaction = await contract.createMarketItem(nftaddress1155, tokenId, price, false, [], { value: listingPrice })

    await transaction.wait()
    router.push('/')
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <img className="rounded mt-4" width="350" src={fileUrl} />
          )
        }
        <button onClick={createMarket} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Create Digital Asset
        </button>
      </div>
    </div>
  )
}