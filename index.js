import { ethers } from "./ethers-5.1.esm.min.js";
import { hardhatChainId, fundMeAddress, abi } from "./constant.js";

let connectButton = document.getElementById("connect");
let fundButton = document.getElementById("fund");
let withdrawButton = document.getElementById("withdraw");
let getBalanceButton = document.getElementById("getBalance");
let input = document.getElementById("input");
let container = document.getElementById("container");

let connectbefore = false;
connectButton.onclick = connect;
getBalanceButton.onclick = getBalance;
fundButton.onclick = fund;
withdrawButton.onclick = withdraw;

//this function is to connect aour website to metamask
async function connect() {
  if (window.ethereum) {
    try {
      let accounts = await ethereum.request({ method: "eth_requestAccounts" });
      connectButton.innerHTML = "connected";
      connectButton.style.backgroundColor = "#33ff46";
      enable();
      if (!connectbefore) {
        window.ethereum.on("accountsChanged", (accounts) => {
          // If user has locked/logout from MetaMask, this resets the accounts array to empty
          if (!accounts[0]) {
            disable();
            alert("connect to MetaMask.");
            connectButton.innerHTML = "connect";
            connectButton.style.color = "black";
            connectButton.style.backgroundColor = "#f0f0f0";
          }
        });
        connectbefore = true;
      }
    } catch (error) {
      if (error.code === 4001) {
        console.log("Please connect to MetaMask.");
        alert("Please connect to MetaMask.");
      } else {
        console.error(error);
      }
    }
  } else {
    if (connectButton.innerHTML == "install metamask") {
      window.open("https://metamask.io/download/", "_blank");
      connectButton.innerHTML = "connect";
      connectButton.style.color = "black";
    } else {
      connectButton.innerHTML = "install metamask";
      connectButton.style.color = "blue";
      alert("metamask is not installed");
    }
  }
}
//this function allow you to get balance locked in our smart contract
async function getBalance() {
  try {
    let hardhat = await verifyChainId();

    if (hardhat) {
      let provider = new ethers.providers.Web3Provider(window.ethereum);
      let balance = await provider.getBalance(fundMeAddress);
      console.log("the balance of the contract is", balance.toString());
      let h1 = document.getElementById("etherAmount");
      if (h1) {
        h1.innerHTML = `the contract's balance is :" ${ethers.utils.formatEther(
          balance
        )} ETH `;
      } else {
        var newh1 = document.createElement("h1");
        newh1.setAttribute("id", "etherAmount");
        newh1.innerHTML = `the contract's balance is :" ${ethers.utils.formatEther(
          balance
        )} ETH `;
        container.appendChild(newh1);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
}
//this function allow you to fund your smart contract using metamask
async function fund() {
  let etherAmount = ethers.utils.parseEther(input.value);
  try {
    let hardhat = await verifyChainId();

    if (hardhat) {
      let provider = new ethers.providers.Web3Provider(window.ethereum);
      let signer = provider.getSigner();
      const fundMeContract = new ethers.Contract(fundMeAddress, abi, signer);
      let fundMeTransaction = await fundMeContract.fund({ value: etherAmount });
      let fundTransactionReceipt = await provider.waitForTransaction(
        fundMeTransaction.hash,
        1
      );
      if (fundTransactionReceipt.status == 1) {
        await getBalance();
        alert("transaction mined check the  balance ");
      } else if (fundTransactionReceipt.status == 0) {
        alert("transaction mined but reverted");
      }
    }
  } catch (error) {
    alert(error.message);
  }
}
//this function allow you to withdraw funds using metamask
async function withdraw() {
  try {
    let hardhat = await verifyChainId();

    if (hardhat) {
      let provider = new ethers.providers.Web3Provider(window.ethereum);
      let signer = provider.getSigner();
      const fundMeContract = new ethers.Contract(fundMeAddress, abi, signer);
      let withdrawTransaction = await fundMeContract.withdraw();
      disable();
      let withdrawTransactionReceipt = await provider.waitForTransaction(
        withdrawTransaction.hash,
        1
      );
      if (withdrawTransactionReceipt.status == 1) {
        await getBalance();
        alert("transaction mined check the  balance ");
      } else if (withdrawTransactionReceipt.status == 0) {
        alert("transaction mined but reverted");
      }
    }
  } catch (error) {
    if (error.data.data.data == "0x30cd7471") {
      alert(
        "you are not the owner of the smart contract, so you are not allowed to withdraw the moeny"
      );
      console.log(error.message);
    } else {
      alert(error.message);
      console.log(error.message);
    }
  }
}
/*verify that the chain that metamask is connected to is the haedhat localhost chainId,
it returns true if metamask is connected to hardhat localhost network , and false if not
*/
async function verifyChainId() {
  try {
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    const { chainId } = await provider.getNetwork();

    await provider.send("wallet_switchEthereumChain", [
      { chainId: hardhatChainId },
    ]);
    return true;
  } catch (error) {
    if (error.code == 4902) {
      console.log("chain not added to metamask");
      alert("chain not added to metamask please add it");
    } else {
      console.log(error.message);
      alert(error.message);
    }
    return false;
  }
}

//enable function to enable buttons when connection with metamask is already established
function enable() {
  fundButton.disabled = false;
  getBalanceButton.disabled = false;
  input.disabled = false;
  withdrawButton.disabled = false;
}
//function to unable buttons
function disable() {
  fundButton.disabled = true;
  getBalanceButton.disabled = true;
  input.disabled = true;
  withdrawButton.disabled = true;
}
