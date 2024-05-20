import React, { useEffect, useState } from "react";
import { ErmisChatWidget } from "ermis-chat-widget";
import { useAccount, useSignTypedData } from "wagmi";
import "./App.css";

const SENDER_ID = "0x8eb718033b4a3c5f8bdea1773ded0259b2300f5d";
const RECEIVER_ID = "0x8Ba208A3bFB80eDD7Fc5FEbF5666E146A3c8722d";

const BASE_URL_AUTH = "https://oauth.ermis.network";

const createNonce = (length: any) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

function App() {
  const { connector, address } = useAccount();
  const { signTypedDataAsync }: any = useSignTypedData();

  const [open, setOpen] = useState<boolean>(false);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (address && connector) {
      const onLogin = async () => {
        try {
          const response = await fetch(`${BASE_URL_AUTH}/auth/start`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ address }),
          });

          if (!response.ok) {
            throw new Error("Network response was not ok");
          }

          const result = await response.json();
          const challenge: any = JSON.parse(result.challenge);
          const { types, domain, primaryType, message } = challenge;

          const nonce = createNonce(20);
          let signature = "";

          await signTypedDataAsync(
            {
              types,
              domain,
              connector,
              primaryType,
              message,
            },
            {
              onSuccess: (s: any) => {
                signature = s;
              },
            }
          );

          if (signature) {
            const data = {
              address,
              signature,
              nonce,
            };
            const responseToken = await fetch(`${BASE_URL_AUTH}/auth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });

            if (!responseToken.ok) {
              throw new Error("Network response was not ok");
            }

            const resultToken = await responseToken.json();
            console.log("resultToken", resultToken);
            if (resultToken) {
              setToken(resultToken.token);
            }
          }
        } catch (error) {
          console.log("error", error);
        }
      };
      onLogin();
    } else {
      setToken("");
    }
  }, [address, connector]);

  const onToggleWidget = () => {
    setOpen(!open);
  };

  console.log('---address--', address)
  console.log('---token--', token)

  return (
    <div className="App">
      <header className="App-header">
        <p style={{ marginBottom: "15px" }}>Ermis chat widget demo</p>
        <w3m-button />
        <div className="result">
          <div className="result-item">
            <p className="p1">Address:</p>
            <p className="p2">{address}</p>
          </div>
          <div className="result-item">
            <p className="p1">Token:</p>
            <p className="p2">{token}</p>
          </div>
        </div>
      </header>

      {address && token && (
        <ErmisChatWidget
          apiKey="pb3FPhlN0FKK1747726078709"
          onToggleWidget={onToggleWidget}
          openWidget={open}
          token={token}
          senderId={SENDER_ID}
          // receiverId={RECEIVER_ID}
        />
      )}
    </div>
  );
}

export default App;
