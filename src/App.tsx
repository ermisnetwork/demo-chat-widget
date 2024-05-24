import React, { useCallback, useEffect, useState } from "react";
import { ErmisChatWidget } from "ermis-chat-widget";
import { useAccount, useSignTypedData } from "wagmi";
import { Alert, Button, Input, Space, Spin, notification } from "antd";
import { debounce } from "lodash";
import "./App.css";

const API_KEY = "KzubBBcsO3KT1747826418734";
const BASE_URL_AUTH = "https://oauth-staging.ermis.network";

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
  const [receiverId, setReceiverId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

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
        } catch (err: any) {
          notification.error({ message: err.message });
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

  const debouncedSearch = useCallback(
    debounce(async (value) => {
      if (!value) return;
      try {
        const params = {
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [value.trim(), "latest"],
          id: 1,
        };
        setLoading(true);
        const response = await fetch(
          `https://mainnet.infura.io/v3/8abf30920f8f404ea7ebdeaf6d7ec53e`,
          {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }
        );
        const result = await response.json();
        setResult(result);
        if (result.error) {
          setReceiverId("");
        } else {
          setReceiverId(value.trim());
        }
      } catch (error) {
        setReceiverId("");
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const onChangeAddress = (e: any) => {
    const value = e.target.value;
    if (value) {
      debouncedSearch(value);
    } else {
      setReceiverId("");
      setResult(null);
    }
  };

  const renderAlert = () => {
    if (result) {
      if (result.error) {
        return <Alert message={result.error.message} type="error" showIcon />;
      } else {
        return <Alert message="Valid wallet address" type="success" showIcon />;
      }
    } else {
      return null;
    }
  };

  const onStartNewChat = async () => {
    setOpen(true);
  };

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

        {address && token && (
          <div className="searchBox">
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="Enter receiver address"
                onChange={onChangeAddress}
              />
              <Button
                type="primary"
                style={{ color: "#fff" }}
                disabled={!result || (result && result.error)}
                onClick={onStartNewChat}
              >
                Start new chat
              </Button>
            </Space.Compact>
            {loading && <Spin style={{ marginTop: 20 }} />}
            <div style={{ marginTop: "15px" }}>{renderAlert()}</div>
          </div>
        )}
      </header>

      {address && token && (
        <ErmisChatWidget
          apiKey={API_KEY}
          onToggleWidget={onToggleWidget}
          openWidget={open}
          token={token}
          senderId={address}
          receiverId={receiverId}
        />
      )}
    </div>
  );
}

export default App;
