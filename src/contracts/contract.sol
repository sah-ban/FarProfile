// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FarProfile is ERC721URIStorage, Ownable {
    string public baseURI;
    uint256 public nextTokenId;
    uint256 public constant MINT_FEE = 0.0003 ether;
    address public constant feeRecipient = 0x21808EE320eDF64c019A6bb0F7E4bFB3d62F06Ec;

    event Minted(address indexed minter, uint256 tokenId, uint256 fid);

    constructor() ERC721("FarProfile", "FarProfile") Ownable(msg.sender) {
        baseURI = "https://far-profile.vercel.app/api/metadata?fid=";
        nextTokenId = 1; // Start token IDs from 1
    }

    function mintNFT(uint256 fid) public payable {
        require(msg.value >= MINT_FEE, "Insufficient ETH sent");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(baseURI, toString(fid))));

       
        payable(feeRecipient).transfer(msg.value);

        emit Minted(msg.sender, tokenId, fid);
    }

    function updateBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
