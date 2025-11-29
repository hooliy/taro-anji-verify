import Taro, { getStorage, setStorage, createSelectorQuery } from '@tarojs/taro';
import { useState, useEffect, useRef } from 'react';
import { View, Text, Image } from '@tarojs/components';
import { getPicture, reqCheck, aesEncrypt } from './base';
import defaultImg from './default.jpg';
import './index.scss';

const VerifyPointFixed = (props: any) => {
  const {
    vSpace = 5,
    imgSize = { width: '310px', height: '200px' },
    barSize = { width: '310px', height: '40px' },
    setSize = { imgHeight: 200, imgWidth: 310, barHeight: 0, barWidth: 0 },
    isPointShow,
    verifyPointFixedChild,
    baseUrl
  } = props;

  const [secretKey, setSecretKey] = useState('');
  const [checkNum] = useState(3);
  const [num, setNum] = useState(1);
  const [pointBackImgBase, setPointBackImgBase] = useState('');
  const [backToken, setBackToken] = useState('');
  const [captchaType] = useState('clickWord');
  const [tempPoints, setTempPoints] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [barAreaColor, setBarAreaColor] = useState('rgb(0,0,0)');
  const [barAreaBorderColor, setBarAreaBorderColor] = useState('rgb(221, 221, 221)');
  const [bindingClick, setBindingClick] = useState(true);

  const imgAreaRef = useRef<{ left: number, top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    initUuid();
    getData();

    setTimeout(() => {
      getImgArea();
    }, 500);
  }, []);

  const getImgArea = () => {
    const query = createSelectorQuery();
    query.select('.verify-img-panel').boundingClientRect(rect => {
      if (rect && !Array.isArray(rect)) {
        imgAreaRef.current = { left: rect.left, top: rect.top };
      }
    }).exec();
  }

  const initUuid = async () => {
    var s: string[] = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((parseInt(s[19], 16) & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";

    var slider = 'slider' + '-' + s.join("");
    var point = 'point' + '-' + s.join("");

    try {
      await getStorage({ key: 'slider' });
    } catch (e) {
      await setStorage({ key: 'slider', data: slider });
    }

    try {
      await getStorage({ key: 'point' });
    } catch (e) {
      await setStorage({ key: 'point', data: point });
    }
  }

  const getData = async () => {
    let point = '';
    try {
      const res = await getStorage({ key: 'point' });
      point = res.data;
    } catch (e) { }
    getPicture({ captchaType: captchaType, clientUid: point, ts: Date.now() }, baseUrl).then(res => {
      if (res.repCode === '0000') {
        setPointBackImgBase(res.repData.originalImageBase64);
        setBackToken(res.repData.token);
        setSecretKey(res.repData.secretKey);
        setText('请依次点击【' + res.repData.wordList + '】');
      }

      if (res.repCode == '6201') {
        setPointBackImgBase('');
        setText(res.repMsg);
        setBarAreaColor('#d9534f');
        setBarAreaBorderColor('#d9534f');
      }
    })
  }

  const refresh = () => {
    getData();
    setNum(1);
    setTempPoints([]);
    setBindingClick(true);
    setBarAreaColor('rgb(0,0,0)');
    setBarAreaBorderColor('rgb(221, 221, 221)');
  }

  const getMousePos = (e: any) => {
    const x = e.detail.x - imgAreaRef.current.left;
    const y = e.detail.y - imgAreaRef.current.top;
    return { x, y };
  }

  const canvasClick = async (e: any) => {
    if (bindingClick) {
      const pos = getMousePos(e);
      const newTempPoints = [...tempPoints, pos];
      setTempPoints(newTempPoints);

      if (num === checkNum) {
        setBindingClick(false);
        let point = '';
        try {
          const res = await getStorage({ key: 'point' });
          point = res.data;
        } catch (e) { }
        let data = {
          captchaType: captchaType,
          "pointJson": secretKey ? aesEncrypt(JSON.stringify(newTempPoints), secretKey) : JSON.stringify(newTempPoints),
          "token": backToken,
          clientUid: point,
          ts: Date.now()
        }
        reqCheck(data, baseUrl).then(res => {
          if (res.repCode === '0000') {
            setText('验证成功');
            setBarAreaColor('#4cae4c');
            setBarAreaBorderColor('#5cb85c');
            setTimeout(() => {
              refresh();
            }, 1500);
          } else {
            setText(res.repMsg);
            setBarAreaColor('#d9534f');
            setBarAreaBorderColor('#d9534f');
            setTimeout(() => {
              refresh();
            }, 1000);
          }
        })
      }
      if (num < checkNum) {
        setNum(num + 1);
      }
    }
  }

  const closeBox = () => {
    verifyPointFixedChild && verifyPointFixedChild(false);
  }

  return (
    <View className='mask' style={{ display: isPointShow ? 'block' : 'none' }}>
      <View className='verifybox' style={{ maxWidth: parseInt(imgSize.width) + 30 + 'px' }}>
        <View className='verifybox-top'>
          请完成安全验证
          <View className='verifybox-close' onClick={closeBox}>
            <Text className='iconfont icon-close'></Text>
          </View>
        </View>
        <View className='verifybox-bottom' style={{ padding: '15px' }}>
          <View style={{ position: 'relative' }}>
            <View className='verify-img-out'>
              <View
                className='verify-img-panel'
                style={{
                  width: setSize.imgWidth + 'px',
                  height: setSize.imgHeight + 'px',
                  backgroundSize: setSize.imgWidth + 'px' + ' ' + setSize.imgHeight + 'px',
                  marginBottom: vSpace + 'px',
                }}
              >
                <View className='verify-refresh' style={{ zIndex: 3 }} onClick={refresh}>
                  <Text className='iconfont icon-refresh'></Text>
                </View>
                {
                  pointBackImgBase ?
                    <Image
                      src={'data:image/png;base64,' + pointBackImgBase}
                      style={{ width: '100%', height: '100%', display: 'block' }}
                      onClick={canvasClick}
                    /> :
                    <Image
                      src={defaultImg}
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                }
                {
                  tempPoints.map((tempPoint: { x: number, y: number }, index: number) => {
                    return (
                      <View
                        key={index}
                        className="point-area"
                        style={{
                          backgroundColor: '#1abd6c',
                          color: '#fff',
                          zIndex: 9999,
                          width: '20px',
                          height: '20px',
                          textAlign: 'center',
                          lineHeight: '20px',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: parseInt(String(tempPoint.y - 10)) + 'px',
                          left: parseInt(String(tempPoint.x - 10)) + 'px',
                          overflow: 'hidden'
                        }}
                      >
                        {index + 1}
                      </View>
                    );
                  })
                }
              </View>
            </View>

            <View
              className='verify-bar-area'
              style={{
                width: setSize.imgWidth + 'px',
                color: barAreaColor,
                borderColor: barAreaBorderColor,
                lineHeight: barSize.height,
              }}
            >
              <Text className='verify-msg'>{text}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default VerifyPointFixed;
