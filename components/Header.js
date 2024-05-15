import { ConnectButton } from "@web3uikit/web3";
import { useMoralis } from "react-moralis";

export default function Header() {
  const { enableWeb3 } = useMoralis();
  return (
    <div className="p-5 border-b-2 flex flex-1">
      <h1 className="py-4 px-4 text-3xl font-bold">Decentralized Lottery</h1>
      <div className="ml-auto py-2 px-4">
        <ConnectButton moralisAuth={false} />
      </div>
    </div>
  );
}
