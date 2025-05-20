// Import các thư viện cần thiết
import express from 'express';
import path from 'path';
import { ethers } from 'ethers';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Cấu hình __dirname cho ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cấu hình dotenv
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Phục vụ các file tĩnh từ thư mục hiện tại
app.use(express.static(__dirname));

// Cấu hình để nhận dữ liệu JSON
app.use(express.json());

// Middleware kiểm tra kết nối blockchain
app.use('/api', (req, res, next) => {
    if (!provider || !contract) {
        return res.status(500).json({ error: 'Chưa khởi tạo kết nối blockchain' });
    }
    next();
});

// Khởi tạo các biến và hằng số cần thiết
const CONTRACT_ADDRESS = '0x0e381cd73faa421066dc5e2829a973405352168c';
const BASE_RPC_URL = 'https://mainnet.base.org';

// Khởi tạo provider để kết nối với mạng BASE
let provider;
let contract;

// Hàm khởi tạo provider với retry
async function initializeProvider(retries = 3, timeout = 10000) {
    for (let i = 0; i < retries; i++) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
            
            // Thêm timeout cho việc kiểm tra kết nối
            const networkPromise = provider.getNetwork();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
            );

            await Promise.race([networkPromise, timeoutPromise]);
            console.log('Đã kết nối thành công đến mạng BASE');
            return provider;
        } catch (error) {
            console.error(`Lần thử ${i + 1}/${retries} thất bại:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2s trước khi thử lại
        }
    }
}

// Khởi tạo provider và contract
try {
    provider = await initializeProvider();
    
    // Interface tối thiểu cho hợp đồng NFT (ERC721)
    const minABI = [
        'function tokenURI(uint256 tokenId) view returns (string)',
        'function balanceOf(address owner) view returns (uint256)',
        'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
    ];

    // Khởi tạo contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, minABI, provider);
} catch (error) {
    console.error('Lỗi khi khởi tạo provider hoặc contract:', error);
}

// Hàm để lấy metadata từ URI
async function getMetadata(tokenURI) {
    try {
        // Xử lý IPFS URI
        if (tokenURI.startsWith('ipfs://')) {
            tokenURI = `https://ipfs.io/ipfs/${tokenURI.slice(7)}`;
        }

        const response = await fetch(tokenURI);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const metadata = await response.json();

        // Xử lý IPFS cho hình ảnh
        if (metadata.image && metadata.image.startsWith('ipfs://')) {
            metadata.image = `https://ipfs.io/ipfs/${metadata.image.slice(7)}`;
        }

        return metadata;
    } catch (error) {
        console.error('Lỗi khi lấy metadata:', error);
        return {
            name: 'Unknown NFT',
            description: 'Không thể lấy thông tin',
            image: 'https://via.placeholder.com/200?text=No+Image'
        };
    }
}

// API endpoint để lấy thông tin NFT
app.get('/api/nfts/:walletAddress', async (req, res) => {
    try {
        const walletAddress = req.params.walletAddress;

        // Kiểm tra địa chỉ ví hợp lệ
        if (!ethers.utils.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Địa chỉ ví không hợp lệ' });
        }

        // Lấy số lượng NFT của ví
        let balance;
        try {
            balance = await contract.balanceOf(walletAddress);
        } catch (error) {
            console.error('Lỗi khi lấy số lượng NFT:', error);
            return res.status(500).json({ error: 'Không thể kết nối với blockchain' });
        }

        if (balance.toNumber() === 0) {
            return res.json({ nfts: [] });
        }

        // Lấy thông tin từng NFT
        const nfts = [];
        const errors = [];
        for (let i = 0; i < balance.toNumber(); i++) {
            try {
                // Lấy token ID
                let tokenId;
                try {
                    tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
                } catch (error) {
                    console.error(`Lỗi khi lấy tokenId cho index ${i}:`, error);
                    if (error.code === 'CALL_EXCEPTION') {
                        errors.push(`NFT thứ ${i + 1} không tồn tại hoặc không thuộc về địa chỉ ví này`);
                    } else {
                        errors.push(`Không thể lấy thông tin NFT thứ ${i + 1}`);
                    }
                    continue;
                }
                
                // Lấy metadata URI
                let tokenURI;
                try {
                    tokenURI = await contract.tokenURI(tokenId);
                } catch (error) {
                    console.error(`Lỗi khi lấy tokenURI cho token ${tokenId}:`, error);
                    errors.push(`Không thể lấy URI cho NFT ID ${tokenId}`);
                    continue;
                }
                
                // Lấy metadata
                let metadata;
                try {
                    metadata = await getMetadata(tokenURI);
                    nfts.push({
                        tokenId: tokenId.toString(),
                        name: metadata.name || 'Unknown Name',
                        description: metadata.description || 'No description available',
                        image: metadata.image || 'https://via.placeholder.com/200?text=No+Image'
                    });
                } catch (error) {
                    console.error(`Lỗi khi lấy metadata cho token ${tokenId}:`, error);
                    errors.push(`Không thể lấy metadata cho NFT ID ${tokenId}`);
                    // Thêm NFT với thông tin tối thiểu
                    nfts.push({
                        tokenId: tokenId.toString(),
                        name: 'Unknown NFT',
                        description: 'Không thể lấy thông tin',
                        image: 'https://via.placeholder.com/200?text=Error'
                    });
                }
            } catch (error) {
                console.error('Lỗi không xác định khi xử lý NFT:', error);
                errors.push('Lỗi không xác định khi xử lý NFT');
                continue;
            }
        }

        res.json({ 
            nfts,
            errors: errors.length > 0 ? errors : undefined,
            total: balance.toNumber(),
            success: nfts.length
        });
    } catch (err) {
        console.error('Lỗi:', err);
        res.status(500).json({ error: 'Có lỗi xảy ra khi lấy thông tin NFT' });
    }
});

// Route mặc định trả về trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});