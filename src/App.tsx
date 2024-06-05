import React, { useCallback, useState } from 'react';
import { ErmisChatWidget } from 'ermis-chat-widget-sdk';
import { useAccount, useDisconnect, useSignTypedData } from 'wagmi';
import { Alert, Button, Input, Space, Spin, notification } from 'antd';
import { debounce } from 'lodash';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import './App.css';

const API_KEY = 'IxtqdBgFA6KK1732952602719';
const BASE_URL_AUTH = 'https://oauth.ermis.network';

const createNonce = (length: any) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

function App() {
  const { connector, address } = useAccount();
  const { signTypedDataAsync }: any = useSignTypedData();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  const [openWidget, setOpenwidget] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const [receiverId, setReceiverId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const onToggleWidget = () => {
    setOpenwidget(!openWidget);
  };

  const debouncedSearch = useCallback(
    debounce(async value => {
      if (!value) return;
      try {
        const params = {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [value.trim(), 'latest'],
          id: 1,
        };
        setLoading(true);
        const response = await fetch(
          `https://mainnet.infura.io/v3/8abf30920f8f404ea7ebdeaf6d7ec53e`,
          {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          }
        );
        const result = await response.json();
        setResult(result);
        if (result.error) {
          setReceiverId('');
        } else {
          setReceiverId(value.trim());
        }
      } catch (error) {
        setReceiverId('');
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
      setReceiverId('');
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
    setOpenwidget(true);
  };

  const onLogin = async () => {
    try {
      if (address && connector) {
        const response = await fetch(`${BASE_URL_AUTH}/auth/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        const challenge: any = JSON.parse(result.challenge);
        const { types, domain, primaryType, message } = challenge;
        const nonce = createNonce(20);
        let signature = '';
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
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          if (!responseToken.ok) {
            throw new Error('Network response was not ok');
          }
          const resultToken = await responseToken.json();
          console.log('resultToken', resultToken);
          if (resultToken) {
            setToken(resultToken.token);
          }
        }
      }
    } catch (err: any) {
      notification.error({ message: err.message });
    }
  };

  const onLogout = () => {
    disconnect();
    setToken('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <p style={{ marginBottom: '15px' }}>Ermis chat widget demo</p>
        {token ? (
          <Button
            type="primary"
            danger
            style={{
              width: '120px',
              height: '40px',
              borderRadius: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 500,
              fontSize: '15px',
            }}
            onClick={onLogout}
          >
            Log out
          </Button>
        ) : (
          <>
            <div className="buttonGroup">
              <div className="buttonGroup-item">
                <span>1. </span>
                {address ? (
                  <w3m-button />
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      borderRadius: '32px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 500,
                      width: '150px',
                    }}
                    onClick={() => open()}
                  >
                    Connect wallet
                  </Button>
                )}
              </div>
              <div className="buttonGroup-item">
                <span>2. </span>
                <Button
                  disabled={!address}
                  type="primary"
                  size="large"
                  style={{
                    borderRadius: '32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 500,
                    width: '150px',
                  }}
                  onClick={onLogin}
                >
                  Sign in
                </Button>
              </div>
            </div>
          </>
        )}
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
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Enter receiver address"
                onChange={onChangeAddress}
                size="large"
              />
              <Button
                type="primary"
                style={{ color: '#fff' }}
                disabled={!result || (result && result.error)}
                onClick={onStartNewChat}
                size="large"
              >
                Start new chat
              </Button>
            </Space.Compact>
            {loading && <Spin style={{ marginTop: 20 }} />}
            <div style={{ marginTop: '15px' }}>{renderAlert()}</div>
          </div>
        )}
      </header>

      {address && token && (
        <ErmisChatWidget
          apiKey={API_KEY}
          onToggleWidget={onToggleWidget}
          openWidget={openWidget}
          token={token}
          senderId={address}
          receiverId={receiverId}
        />
      )}
    </div>
  );
}

export default App;
