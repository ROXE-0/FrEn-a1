import { useEffect, useState } from "react";

// Define your list of supported chain IDs (Decimals)
const SUPPORTED_CHAINS = [1, 11155111]; // e.g., 1 = Ethereum Mainnet, 11155111 = Sepolia Testnet
const DEFAULT_CHAIN_ID_HEX = "0x1"; // Hex string for Mainnet ("0xaa36a7" for Sepolia)

const Eip6963 = () => {
  const [providers, setProviders] = useState([]);
  const [activeProvider, setActiveProvider] = useState(null); // Track which provider is being used
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);

  useEffect(() => {
    const requestEvent = new Event("eip6963:requestProvider");
    window.dispatchEvent(requestEvent);

    window.addEventListener("eip6963:announceProvider", (event) => {
      console.log("Provider: ", event.detail);
      setProviders((prev) => [...prev, event.detail]);
    });
  }, []);

  // Listen to chain changes dynamically if a provider is connected
  useEffect(() => {
    if (!activeProvider) return;

    const handleChainChanged = (hexChainId) => {
      const parsedChain = parseInt(hexChainId, 16);
      setChainId(parsedChain);
      checkAndSwitchChain(parsedChain, activeProvider);
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        handleDisconnect();
      }
    };

    activeProvider.on("chainChanged", handleChainChanged);
    activeProvider.on("accountsChanged", handleAccountsChanged);

    return () => {
      activeProvider.removeListener("chainChanged", handleChainChanged);
      activeProvider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [activeProvider]);

  // Function to prompt and switch the network automatically if unsupported
  const checkAndSwitchChain = async (currentChainId, providerInstance) => {
    if (!SUPPORTED_CHAINS.includes(currentChainId)) {
      alert(
        `Unsupported Chain Detected (Chain ID: ${currentChainId})! Please switch to a supported network.`,
      );

      try {
        // Request the wallet to switch networks automatically
        await providerInstance.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: DEFAULT_CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        console.error("Failed to automatically switch network:", switchError);
      }
    }
  };

  const handleConnectWallet = async (provider) => {
    try {
      if (provider) {
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);

        const rawChainId = await provider.request({ method: "eth_chainId" });
        const parsedChainId = parseInt(rawChainId, 16);
        setChainId(parsedChainId);
        setActiveProvider(provider); // Store provider reference for listeners and switching

        // Check if the initial connection is on a supported chain
        await checkAndSwitchChain(parsedChainId, provider);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Disconnect function clearing UI state
  const handleDisconnect = () => {
    setAccount("");
    setChainId(0);
    setActiveProvider(null);
    console.log("Disconnected wallet connection from UI state.");
  };

  return (
    <div style={{ padding: "20px" }}>
      {!account && (
        <div>
          <h3>Select a Wallet to Connect:</h3>
          {providers.map((provider, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <img
                src={provider.info.icon}
                alt={provider.info.name}
                width={40}
                height={40}
              />
              <p>{provider.info.name}</p>
              <button onClick={() => handleConnectWallet(provider.provider)}>
                Connect {provider.info.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {account && (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "8px",
          }}
        >
          <h2>Connection Established</h2>
          <p>
            <strong>Account Connected:</strong> {account}
          </p>
          <p>
            <strong>Chain Connected:</strong> {chainId}
            {SUPPORTED_CHAINS.includes(chainId)
              ? " ✅ (Supported)"
              : " ❌ (Unsupported)"}
          </p>

          <button
            onClick={handleDisconnect}
            style={{
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default Eip6963;

// import { useEffect, useState } from "react";

// const Eip6963 = () => {
//   const [providers, setProviders] = useState([]);
//   const [account, setAccount] = useState("");
//   const [chainId, setChainId] = useState(0);

//   useEffect(() => {
//     const requestEvent = new Event("eip6963:requestProvider");

//     window.dispatchEvent(requestEvent);

//     window.addEventListener("eip6963:announceProvider", (event) => {
//       console.log("Provider: ", event.detail);
//       setProviders((providers) => [...providers, event.detail]);
//     });
//   }, []);

//   const handleConnectWallet = async (provider) => {
//     console.log(provider);
//     try {
//       if (provider) {
//         const accounts = await provider.request({
//           method: "eth_requestAccounts",
//         });
//         setAccount(accounts[0]);

//         const chainId = await provider.request({ method: "eth_chainId" });
//         setChainId(parseInt(chainId, 16));
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <div>
//       {providers.map((provider) => (
//         <div style={{ display: "flex", gap: "10px" }}>
//           <img
//             src={provider.info.icon}
//             alt={provider.info.name}
//             width={50}
//             height={50}
//           />
//           <p>{provider.info.name}</p>
//           <button onClick={() => handleConnectWallet(provider.provider)}>
//             connect {provider.info.name}
//           </button>
//         </div>
//       ))}

//       {account && (
//         <div>
//           <h2>Connected Established</h2>

//           <p>Account Connected: {account}</p>
//           <p>Chain connected: {chainId}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Eip6963;
