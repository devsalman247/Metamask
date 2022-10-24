import { useState, useEffect } from "react";
import Web3 from "web3";

function App() {
  const [user, setUser] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  const saveUserInfo = (ethBalance, account, chainId) => {
    const userAccount = {
      account: account,
      balance: ethBalance,
      connectionid: chainId,
    };
    window.localStorage.setItem("metamask", JSON.stringify(userAccount));
    const userData = JSON.parse(localStorage.getItem("metamask"));
    setUser(userData);
    setIsConnected(true);
  };

  async function connectWallet() {
    let provider;
    if (window.ethereum) {
      provider = window.ethereum;
    } else if (window.web3) {
      provider = window.web3.currentProvider;
    } else {
      console.log(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
    try {
      if (provider) {
        await provider.request({ method: "eth_requestAccounts" });
      }
      const web3 = new Web3(provider);
      const userAccount = await web3.eth.getAccounts();
      if (userAccount.length === 0) {
        console.log("Please connect to meta mask");
      }
      const chainId = await web3.eth.getChainId();
      const account = userAccount[0];
      let ethBalance = await web3.eth.getBalance(account);
      ethBalance = web3.utils.fromWei(ethBalance, "ether");
      saveUserInfo(ethBalance, account, chainId);
    } catch (err) {
      console.log(err);
    }
  }

  const onDisconnect = () => {
    window.localStorage.removeItem("metamask");
    setUser({});
    setIsConnected(false);
  };

  useEffect(() => {
    function checkConnectedWallet() {
      const userData = JSON.parse(localStorage.getItem("metamask"));
      if (userData != null) {
        setUser(userData);
        setIsConnected(true);
      }
    }
    checkConnectedWallet();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {Object.keys(user).length !== 0 ? (
        <>
          <button className="px-3 py-2 rounded bg-slate-500 text-white focus:outline-none">
            Connected
          </button>
          <button
            className="mt-2 px-3 py-2 rounded bg-slate-500 text-white focus:outline-none"
            onClick={onDisconnect}
          >
            Disconnect Wallet
          </button>
          <div className="mt-4">
            <div>
              Status : Connected <br />
              Account : {user.account} <br />
              Balance : {user.balance} ETH
            </div>
          </div>
        </>
      ) : (
        <div>
          <button
            className="px-3 py-2 rounded bg-slate-500 text-white focus:outline-none"
            onClick={connectWallet}
          >
            Connect to Metamask
          </button>
          <div className="mt-2">Status : Not Connected</div>
        </div>
      )}
    </div>
  );
}

export default App;
