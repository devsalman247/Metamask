import { useState, useEffect } from "react";
import WalletConnectProvider from "@walletconnect/web3-provider/dist/umd/index.min.js";
import { ethers } from "ethers";
import Swal from "sweetalert2";
import Web3 from "web3";

function App() {
  const [user, setUser] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(0);

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

  const saveWallet = (account, ethBalance, chainId) => {
    const userAccount = {
      account: account,
      balance: ethBalance,
      connectionid: chainId,
    };
    window.localStorage.setItem("walletconnect", JSON.stringify(userAccount));
    const userData = JSON.parse(localStorage.getItem("walletconnect"));
    setUser(userData);
    setIsConnected(true);
  };

  async function walletconnect() {
    const provider = new WalletConnectProvider({
      infuraId: "d9f3bb64fb3c42d59ec58bb01df0cdb9",
    });

    try {
      if (provider) {
        await provider.enable();

        provider.on("accountsChanged", (accounts) => {
          console.log(accounts);
        });

        provider.on("chainChanged", (chainId) => {
          console.log(chainId);
        });

        provider.on("disconnect", async (code, reason) => {
          await provider.disconnect();
          setUser({});
          setIsConnected(false);
        });
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        let ethBalance = await web3.eth.getBalance(accounts[0]);
        ethBalance = web3.utils.fromWei(ethBalance, "ether");
        const chainId = await web3.eth.getChainId();
        if (chainId !== 56) {
          Swal.fire({
            position: "center",
            icon: "error",
            title:
              "Wrong chain selected..Please select Binance Smart Chain to connect",
            showConfirmButton: false,
            timer: 1500,
          });
          await provider.disconnect();
          setUser({});
          setIsConnected(false);
          return;
        }
        saveWallet(account, ethBalance, chainId);
      } else {
        console.log("Something went wrong!!");
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function connectByEther() {
    if (chainId !== 56) {
      Swal.fire({
        position: "center",
        icon: "error",
        title:
          "Wrong chain selected..Please select Binance Smart Chain to connect",
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const chainId = await signer.getChainId();
        const account = await signer.getAddress();
        let ethBalance = await provider.getBalance(account);
        ethBalance = ethers.utils.formatEther(ethBalance);
        await signer.signMessage("Hello Web3!");
        saveUserInfo(ethBalance, account, chainId);
      } else {
        console.log("Can't found any ethereum configured wallet");
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function connectWallet() {
    console.log(chainId);
    if (chainId !== 56) {
      Swal.fire({
        position: "center",
        icon: "error",
        title:
          "Wrong chain selected..Please select Binance Smart Chain to connect",
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }
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
      provider.on("disconnect", async (code, reason) => {
        window.localStorage.removeItem("metamask");
        await provider.disconnect();
        setUser({});
        setIsConnected(false);
      });
      const web3 = new Web3(provider);
      const userAccount = await web3.eth.getAccounts();
      await web3.eth.personal
        .sign("Hello Web3!", userAccount[0])
        .then(console.log);
      const chainId = await web3.eth.getChainId();
      const account = userAccount[0];
      let ethBalance = await web3.eth.getBalance(account);
      ethBalance = web3.utils.fromWei(ethBalance, "ether");
      saveUserInfo(ethBalance, account, chainId);
    } catch (err) {
      console.log(err);
    }
  }

  const onDisconnect = async () => {
    window.localStorage.removeItem("metamask");
    const walletconnect = localStorage.getItem("walletconnect");
    if (walletconnect) {
      localStorage.removeItem("walletconnect");
    }
    setUser({});
    setIsConnected(false);
  };

  async function getChainId() {
    const web3 = new Web3(window.ethereum);
    const chainId = await web3.eth.getChainId();
    setChainId(chainId);
  }

  const getWalletDetails = async () => {
    
  }

  useEffect(() => {
    if (chainId !== 56 && chainId !== 0) {
      Swal.fire({
        position: "center",
        icon: "error",
        title:
          "Wrong chain selected..Please select Binance Smart Chain to connect",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }, [chainId]);

  useEffect(() => {
    function checkConnectedWallet() {
      const userData =
        JSON.parse(localStorage.getItem("metamask")) ||
        JSON.parse(localStorage.getItem("walletconnect"));
      if (userData != null) {
        setUser(userData);
        setIsConnected(true);
      }
    }
    getChainId();
    window.ethereum.on("accountsChanged", async (accounts) => {
      console.log(accounts);
      if (accounts.length === 0) {
        window.localStorage.removeItem("metamask");
        setUser({});
        setIsConnected(false);
      }
    });
    window.ethereum.on("chainChanged", (chainId) => {
      getChainId();
    });
    checkConnectedWallet();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {Object.keys(user).length !== 0 ? (
        <>
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
            <button
              className="px-3 py-2 rounded bg-slate-500 text-white focus:outline-none"
              onClick={getWalletDetails}
            >
              Get my wallet details
            </button>
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
          <button
            className="px-3 py-2 ml-2 rounded bg-slate-500 text-white focus:outline-none"
            onClick={connectByEther}
          >
            Connect to Metamask using EtherJs
          </button>
          <button
            className="px-3 py-2 ml-2 rounded bg-slate-500 text-white focus:outline-none"
            onClick={walletconnect}
          >
            Connect with WalletConnect
          </button>
          <div className="mt-2">Status : Not Connected</div>
        </div>
      )}
    </div>
  );
}

export default App;
