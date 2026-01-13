import React, { useState } from 'react';

interface ShareProductProps {
  productId: string;
  productName: string;
  productUrl?: string;
}

export default function ShareProduct({ productId, productName, productUrl }: ShareProductProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const url = productUrl || `${window.location.origin}/product/${productId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Confira este produto: ${productName} - ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `Confira: ${productName}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const handleShareEmail = () => {
    const subject = `Confira este produto: ${productName}`;
    const body = `Olá,\n\nEncontrei este produto que pode te interessar:\n${productName}\n\n${url}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <span>📤</span>
        <span>Compartilhar</span>
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            onClick={handleShareWhatsApp}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>💬</span> WhatsApp
          </button>
          <button
            onClick={handleShareFacebook}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>f</span> Facebook
          </button>
          <button
            onClick={handleShareTwitter}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>𝕏</span> Twitter
          </button>
          <button
            onClick={handleShareEmail}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>✉️</span> Email
          </button>
          <div className="border-t"></div>
          <button
            onClick={handleCopyLink}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>🔗</span> {copied ? 'Copiado!' : 'Copiar Link'}
          </button>
        </div>
      )}
    </div>
  );
}
