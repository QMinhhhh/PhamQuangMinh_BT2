// Hàm chính để lấy và hiển thị NFT
async function getNFTs() {
    // Lấy các phần tử DOM cần thiết
    const walletAddressInput = document.getElementById('walletAddress');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const nftGrid = document.getElementById('nftGrid');

    // Xóa nội dung cũ
    errorDiv.textContent = '';
    nftGrid.innerHTML = '';

    // Lấy và kiểm tra địa chỉ ví
    const walletAddress = walletAddressInput.value.trim();
    if (!walletAddress) {
        errorDiv.textContent = 'Vui lòng nhập địa chỉ ví!';
        return;
    }

    try {
        // Hiển thị loading
        loadingDiv.classList.remove('d-none');

        // Gọi API để lấy thông tin NFT
        const response = await fetch(`/api/nfts/${walletAddress}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Có lỗi xảy ra');
        }

        if (data.nfts.length === 0) {
            errorDiv.textContent = 'Ví này không sở hữu NFT nào trong bộ sưu tập này.';
            return;
        }

        // Hiển thị từng NFT
        data.nfts.forEach(nft => {
            const nftCard = document.createElement('div');
            nftCard.className = 'col';
            nftCard.innerHTML = `
                <div class="nft-card">
                    <img src="${nft.image}" class="nft-image" 
                         alt="${nft.name}" 
                         onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                    <div class="nft-info">
                        <h5>${nft.name}</h5>
                        <p class="text-muted">${nft.description}</p>
                        <small class="text-muted">Token ID: ${nft.tokenId}</small>
                    </div>
                </div>
            `;

            nftGrid.appendChild(nftCard);
        });
    } catch (err) {
        console.error('Lỗi:', err);
        errorDiv.textContent = err.message || 'Có lỗi xảy ra khi lấy thông tin NFT. Vui lòng thử lại sau.';
    } finally {
        loadingDiv.classList.add('d-none');
    }
}

// Thêm sự kiện cho phím Enter trong ô input
document.getElementById('walletAddress').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getNFTs();
    }
});