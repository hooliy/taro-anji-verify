import Taro, { getStorage, setStorage, createSelectorQuery } from '@tarojs/taro';
import { useState, useEffect, useRef } from 'react';
import { View, Text, Image } from '@tarojs/components';
import { getPicture, reqCheck, aesEncrypt } from './base';
import defaultImg from './default.jpg';
import './index.scss';

const VerifySlide = (props: any) => {
  const {
    vSpace = 5,
    imgSize = { width: '310px', height: '200px' },
    barSize = { width: '310px', height: '40px' },
    setSize = { imgHeight: 200, imgWidth: 310, barHeight: 0, barWidth: 0 },
    transitionWidth,
    finishText,
    transitionLeft,
    baseUrl
  } = props;

  const [blockSize] = useState({ width: '50px', height: '50px' });
  const [backImgBase, setBackImgBase] = useState('');
  const [blockBackImgBase, setBlockBackImgBase] = useState('');
  const [backToken, setBackToken] = useState('');
  const [startMoveTime, setStartMoveTime] = useState(0);
  const [secretKey, setSecretKey] = useState('');
  const [captchaType] = useState('blockPuzzle');
  const [moveBlockBackgroundColor, setMoveBlockBackgroundColor] = useState('rgb(255, 255, 255)');
  const [leftBarBorderColor, setLeftBarBorderColor] = useState('');
  const [iconColor, setIconColor] = useState('');
  const [moveBlockLeft, setMoveBlockLeft] = useState('');
  const [leftBarWidth, setLeftBarWidth] = useState('');
  const [status, setStatus] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const [passFlag, setPassFlag] = useState<boolean | ''>('');
  const [tipWords, setTipWords] = useState('');
  const [text, setText] = useState('向右滑动完成验证');

  const barAreaLeft = useRef(0);
  const barAreaOffsetWidth = useRef(0);
  const startLeft = useRef(0);

  useEffect(() => {
    initUuid();
    getData();

    setTimeout(() => {
      getBarArea();
    }, 500);
  }, []);

  const getBarArea = () => {
    const query = createSelectorQuery();
    query.select('.verify-bar-area').boundingClientRect(rect => {
      if (rect && !Array.isArray(rect)) {
        barAreaLeft.current = rect.left;
        barAreaOffsetWidth.current = rect.width;
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
    let slider = '';
    try {
      const res = await getStorage({ key: 'slider' });
      slider = res.data;
    } catch (e) { }
    getPicture({ captchaType: captchaType, clientUid: slider, ts: Date.now() }, baseUrl).then(res => {
      if (res.repCode == '0000') {
        setBackImgBase(res.repData.originalImageBase64);
        setBlockBackImgBase(res.repData.jigsawImageBase64);
        setBackToken(res.repData.token);
        setSecretKey(res.repData.secretKey);
      }
      if (res.repCode == '6201') {
        setBackImgBase('');
        setBlockBackImgBase('');
        setLeftBarBorderColor('#d9534f');
        setIconColor('#fff');
        setPassFlag(false);
        setTipWords(res.repMsg);

        setTimeout(() => {
          setTipWords('');
        }, 1000);
      }
    })
  }

  const refresh = () => {
    getData();
    setMoveBlockLeft('');
    setLeftBarWidth('');
    setText('向右滑动完成验证');
    setMoveBlockBackgroundColor('#fff');
    setLeftBarBorderColor('#337AB7');
    setIconColor('#fff');
    setStatus(false);
    setIsEnd(false);
  }

  const start = (e: any) => {
    let x;
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX;
    } else {
      x = e.clientX;
    }

    startLeft.current = Math.floor(x - barAreaLeft.current);
    setStartMoveTime(+new Date());

    if (isEnd == false) {
      setText('');
      setMoveBlockBackgroundColor('#337ab7');
      setLeftBarBorderColor('#337AB7');
      setIconColor('#fff');
      setStatus(true);
    }
  }

  const move = (e: any) => {
    if (status && isEnd == false) {
      let x;
      if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX;
      } else {
        x = e.clientX;
      }

      var bar_area_left = barAreaLeft.current;
      var move_block_left = x - bar_area_left;

      if (move_block_left >= barAreaOffsetWidth.current - parseInt(String(parseInt(blockSize.width) / 2)) - 2) {
        move_block_left = barAreaOffsetWidth.current - parseInt(String(parseInt(blockSize.width) / 2)) - 2;
      }
      if (move_block_left <= 0) {
        move_block_left = parseInt(String(parseInt(blockSize.width) / 2));
      }

      const moveLeft = move_block_left - startLeft.current;

      if (moveLeft < 0) return;
      if (moveLeft > (barAreaOffsetWidth.current - parseInt(blockSize.width))) return;

      setMoveBlockLeft(moveLeft + "px");
      setLeftBarWidth(moveLeft + "px");
    }
  }

  const end = async () => {
    const currentEndMovetime = +new Date();

    if (status && isEnd == false) {
      var moveLeftDistance = parseInt((moveBlockLeft || '0').replace('px', ''));
      moveLeftDistance = moveLeftDistance * 310 / parseInt(String(setSize.imgWidth))

      let slider = '';
      try {
        const res = await getStorage({ key: 'slider' });
        slider = res.data;
      } catch (e) { }

      let data = {
        captchaType: captchaType,
        "pointJson": secretKey ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey) : JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
        "token": backToken,
        clientUid: slider,
        ts: Date.now()
      }

      reqCheck(data, baseUrl).then(res => {
        if (res.repCode == "0000") {
          setIsEnd(true);
          setPassFlag(true);
          setTipWords(`${((currentEndMovetime - startMoveTime) / 1000).toFixed(2)}s验证成功`);

          setTimeout(() => {
            setTipWords("");
            refresh();
          }, 1000)
        } else {
          setIsEnd(true);
          setMoveBlockBackgroundColor('#d9534f');
          setLeftBarBorderColor('#d9534f');
          setIconColor('#fff');
          setPassFlag(false);
          setTipWords(res.repMsg || '验证失败');

          setTimeout(() => {
            refresh();
            setTipWords('');
          }, 1000);
        }
      })
      setStatus(false);
    }
  }

  return (
    <View style={{ position: 'relative' }} className='stop-user-select'>
      <View
        className='verify-img-out'
        style={{ height: parseInt(String(setSize.imgHeight)) + vSpace + 'px' }}
      >
        <View
          className='verify-img-panel'
          style={{ width: setSize.imgWidth + 'px', height: setSize.imgHeight + 'px' }}
        >
          {
            backImgBase ? <Image
              src={'data:image/png;base64,' + backImgBase}
              style={{ width: '100%', height: '100%', display: 'block' }}
            /> : <Image
              src={defaultImg}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />}
          <View
            className='verify-refresh'
            onClick={() => refresh()}
          >
            <Text className='iconfont icon-refresh'></Text>
          </View>

          {tipWords.length > 0 && (
            <View
              className={
                passFlag
                  ? `verify-tips suc-bg tips-enter-active`
                  : `verify-tips err-bg tips-enter-active`
              }
            >
              <Text>{tipWords}</Text>
            </View>
          )}
        </View>
      </View>

      <View
        className='verify-bar-area'
        style={{ width: setSize.imgWidth + 'px', height: barSize.height, lineHeight: barSize.height }}
      >
        <Text className='verify-msg'>{text}</Text>
        <View
          className='verify-left-bar'
          style={{
            width: leftBarWidth !== undefined ? leftBarWidth : barSize.height,
            height: barSize.height,
            borderColor: leftBarBorderColor,
            transition: transitionWidth,
          }}
        >
          <Text className='verify-msg'>{finishText}</Text>

          <View
            className='verify-move-block'
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
            style={{
              width: barSize.height,
              height: barSize.height,
              backgroundColor: moveBlockBackgroundColor,
              left: moveBlockLeft,
              transition: transitionLeft,
            }}
          >
            <Text
              className='verify-icon iconfont icon-right'
              style={{ color: iconColor }}
            ></Text>
            <View
              className='verify-sub-block'
              style={{
                width: Math.floor((parseInt(String(setSize.imgWidth)) * 47) / 310) + 'px',
                height: setSize.imgHeight + 'px',
                top: '-' + (parseInt(String(setSize.imgHeight)) + vSpace) + 'px',
                backgroundSize: setSize.imgWidth + ' ' + setSize.imgHeight,
              }}
            >
              <Image
                src={'data:image/png;base64,' + blockBackImgBase}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default VerifySlide;
