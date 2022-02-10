const hre = require("hardhat");

async function main() {
    const NFTMarket = await hre.ethers.getContractFactory("NFTMarket");
    const nftMarket = await NFTMarket.deploy();
    await nftMarket.deployed();
    console.log("nftMarket deployed to:", nftMarket.address);

    const NFT = await hre.ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(nftMarket.address);
    await nft.deployed();
    console.log("nft deployed to:", nft.address);


    const NFT1155 = await hre.ethers.getContractFactory("NFT1155");
    const nft1155 = await NFT.deploy(nftMarket.address);
    await nft1155.deployed();
    console.log("nft1155 deployed to:", nft1155.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
