import { useWeb3Contract } from "react-moralis";
import { abi, contractAddresses } from "../constants";
import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNotification } from "@web3uikit/core";

export default function LotteryEntrance() {
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const raffleAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;

  const [entranceFee, setEntranceFee] = useState(0);
  const [recentWinner, setRecentWinner] = useState(0);
  const [numPlayers, setNumPlayers] = useState(0);

  const dispatch = useNotification();

  const {
    runContractFunction: enterRaffle,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "enterRaffle",
    params: {},
    msgValue: entranceFee,
  });

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getNumberOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getRecentWinner",
    params: {},
  });

  async function updateUI() {
    const entranceFeeFromCall = await getEntranceFee();
    const numPlayersFromCall = (await getNumPlayers()).toString();
    const recentWinnerFromCall = (await getRecentWinner()).toString();
    setEntranceFee(entranceFeeFromCall);
    setNumPlayers(numPlayersFromCall);
    setRecentWinner(recentWinnerFromCall);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      //Get entrance fee
      updateUI();
    }
  }, [isWeb3Enabled]);

  useEffect(() => {
    const provider = new ethers.BrowserProvider(window.ethereum);

    if (raffleAddress) {
      const contract = new ethers.Contract(raffleAddress, abi, provider);

      const requestedRaffleWinnerFilter = contract.filters.RequestedRaffleWinner();
      const winnerPickedFilter = contract.filters.WinnerPicked();

      const handleRequestedRaffleWinner = () => {
        updateUI();
      };

      const handleWinnerPicked = () => {
        updateUI();
      };

      contract.on(requestedRaffleWinnerFilter, handleRequestedRaffleWinner);
      contract.on(winnerPickedFilter, handleWinnerPicked);

      return () => {
        contract.off(requestedRaffleWinnerFilter, handleRequestedRaffleWinner);
        contract.off(winnerPickedFilter, handleWinnerPicked);
      };
    }
  }, [raffleAddress]);

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    handleNewNotification();
    updateUI();
  };

  const handleNewNotification = (tx) => {
    dispatch({
      type: "info",
      message: "Transaction Complete!",
      title: "Tx notification",
      position: "topR",
    });
  };

  return (
    <div className="p-14 text-xl">
      {raffleAddress ? (
        <div>
          <h3>Entrance Fee: {ethers.formatEther(entranceFee.toString())} ETH</h3>
          <button
            className="bg-indigo-500 hover:bg-blue-900 rounded-md py-1 px-3 text-white font-bold ml-auto"
            onClick={async () => {
              await enterRaffle({
                /* onSuccess does not check if the transaction has a block confirmation, it only checks if it was successfully sent to metamask */
                onSuccess: handleSuccess,
                onError: (err) => {
                  console.log(err);
                },
              });
            }}
            disabled={isLoading || isFetching}
          >
            {isFetching || isLoading ? (
              <div className="animate-spin h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              <div>Enter Raffe</div>
            )}
          </button>
          <div>
            <p>Number of Players: {numPlayers}</p>
            <p>Recent Winner: {recentWinner}</p>
            <p></p>
          </div>
        </div>
      ) : (
        <div>No raffle address detected!</div>
      )}
    </div>
  );
}
