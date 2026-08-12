<div align="center">

**Diğer dillerde oku:** [English](README.md) | [Türkçe](README.tr.md)

<img src="./icon.png" alt="DeckThing" width="96" height="96">

# **DeckThing**

</div>

Butonları bir Arduino'ya bağlayın, ardından her birini bir web kontrol panelinden metne, kısayol tuşuna veya scripte eşleyin.

> [!WARNING]
> DeckThing tuş vuruşlarını yazılımla simüle eder ve **çoğu anti-cheat sistemi tarafından algılanır**. Çevrimiçi veya rekabetçi oyunlarda kullanmak hesabınızın yasaklanmasına yol açabilir. Verimlilik, yayın, tek oyunculu ve simülatör kullanımı için tasarlanmıştır.

> [!NOTE]
> Aktif geliştirme aşamasında olan alfa yazılımıdır. Bir sorunla karşılaşırsanız [bir sorun bildirin](https://github.com/tcandrn/DeckThing-release/issues).
>
> DeckThing tamamen yerel ağınızda çalışır ve hiçbir zaman internete bağlanmaz. Windows yerel ağ erişimi izni isteyebilir; kontrol panelinin sunucuya ulaşması için bu gereklidir.

## **Nasıl Çalışır**

1. **Firmware (C++)** Arduino pinlerini tarar ve bir butona basıldığında seri port üzerinden `BTN_x` gönderir.
2. **Sunucu (Node.js)** seri portu okur, kontrol panelini ve bir Socket.IO API'sini barındırır ve her butonun ne yapacağını belirler.
3. **Motor (Python)** tuş vuruşlarını Windows API üzerinden gerçekleştirir.

Kontrol paneli sunucuyla WebSocket üzerinden konuşur; böylece kendi arayüzünüzü koyabilir veya ağınızdaki başka bir cihazdan kullanabilirsiniz.

## **Donanım**

- **Kart:** Arduino Uno R3, Nano, Mini, Micro veya Leonardo
- **Butonlar:** tactile push buton veya Cherry MX switch
- **Kablolama:** buton başına iki jumper kablo, dirence gerek yok

## **Kablolama**

Dahili pull-up dirençleri etkin olduğundan her buton için bir kablo pine, bir kablo toprağa gider. Dirence gerek yoktur:

```
Arduino Pin 2 ──── [Buton 1] ──── GND
Arduino Pin 3 ──── [Buton 2] ──── GND
Arduino Pin A0 ──── [Buton 3] ──── GND
```

Desteklenen pinler: Uno, Nano ve Mini'de `2-13` ve `A0-A5`; Micro ve Leonardo'da `2-16` ve `A0-A5`. Desteklenen her pin kullanılabilir ve butonların ardışık olması gerekmez.

`firmware/firmware.ino` dosyasını yükleyin, ardından bir butona basın. Kontrol paneli her butonu ilk gördüğünde kaydeder.

Firmware, `BTN_` ifadesinin ardından Arduino pin numarasını gönderir; yani pin 2 `BTN_2` olarak gelir. Analog pinler sayısal karşılıklarını kullanır: `A0-A5`, Uno, Nano ve Mini'de `14-19`, Micro ve Leonardo'da `18-23` olur.

## **Kurulum**

Electron 43 gerektirdiği için Node.js 22.12 veya üstü, ayrıca 3.10 ile 3.14 arasında bir Python gerekir. PyInstaller henüz 3.15'i desteklemiyor.

```bash
git clone https://github.com/tcandrn/DeckThing-release.git
cd DeckThing-release
npm install
npm run setup:python
```

Kök dizindeki tek bir `npm install`; kontrol paneli, sunucu ve Electron araçlarının tamamını kurar.

Python otomatik olarak bulunur: sırasıyla `py -3`, `python3` ve `python` denenir ve Windows'taki Microsoft Store takma ad saplaması atlanır. Bunu geçersiz kılmak için `DECK_PYTHON` değişkenine tam yolu verin.

## **Çalıştırma**

```bash
npm run dev
```

Sunucu ve kontrol paneli anlık yenileme ile birlikte başlar. http://localhost:5173 adresini açın.

Sunucunun kontrol panelini kendisinin derleyip sunduğu tek portlu çalıştırma için `npm start` kullanın ve http://localhost:3001 adresini açın. Sunucu `127.0.0.1` adresine bağlanır; ağınızdaki diğer cihazlardan erişmek için `DECK_HOST=0.0.0.0` ayarlayın.

Sistem tepsisiyle birlikte masaüstü uygulaması için:

```bash
npm run engine
npm --prefix electron-builder start
```

### **Komutlar**

| Komut | Ne yapar |
| :---- | :---- |
| `npm install` | Projenin her parçasını yükler |
| `npm run setup:python` | Makro motoru için Python paketlerini yükler |
| `npm run dev` | Sunucu ve kontrol panelini anlık yenileme ile birlikte çalıştırır |
| `npm start` | Kontrol panelini derler ve her şeyi tek portta sunar |
| `npm run serve` | Yeniden derlemeden yalnızca sunucuyu başlatır |
| `npm test` | Node test paketlerini çalıştırır |
| `npm run test:python` | Makro motoru testlerini çalıştırır |
| `npm run engine` | PyInstaller ile macro.exe dosyasını derler |
| `npm run package` | Windows yükleyicisi oluşturur |

## **Hesaplar**

Varsayılan kullanıcı bilgisi yoktur. İlk açılışta bir hesap oluşturmanız istenir. Kullanıcı adları 3-16 alfanümerik karakter, şifreler en az 6 karakter olmalıdır.

Şifreler bcrypt ile hashlenir, oturum kodları sayfa scriptlerinin okuyamaması için HttpOnly çerezlerde saklanır ve şifre değişikliği tüm aktif oturumları geçersiz kılar. Başarısız girişler adres başına 15 dakikada 5 deneme ile sınırlıdır.

## **Buton Eylemleri**

Her butona kontrol panelinden dört eylem türünden biri atanır:

| Tür | Ne yapar |
| :---- | :---- |
| **Text** | En fazla 5000 karakterlik bir metni yazar |
| **Hotkey** | İsteğe bağlı değiştiricilerle bir tuşa basar, örneğin `ctrl` + `shift` + `esc` |
| **Game** | Tek bir `F13`-`F24` tuşuna basar. Bu tuşlar fiziksel klavyelerde bulunmadığından oyunlar bunları çakışma olmadan atayabilir |
| **Script** | Aşağıda açıklanan bir scripti çalıştırır |

## **Scriptler**

Bir buton tek bir tuş vuruşu yerine script de çalıştırabilir:

| Komut | Etkisi |
| :---- | :---- |
| `TYPE metin` | Metni yazıldığı gibi yazar |
| `PRESS tuş` | Bir tuşa veya `ctrl+shift+esc` gibi bir kombinasyona basar |
| `WAIT ms` | Verilen milisaniye kadar bekler |
| `REM metin` | Yorum satırı, yok sayılır |

Not Defteri'ni açıp içine yazmak:

```
PRESS win+r
WAIT 500
TYPE notepad
PRESS enter
WAIT 1000
TYPE This is automated!
```

Ekran görüntüsünü Paint'e yapıştırmak:

```
REM görüntüyü al, sonra Paint'i açıp yapıştır
PRESS printscreen
WAIT 500
PRESS win+r
WAIT 300
TYPE mspaint
PRESS enter
WAIT 1500
PRESS ctrl+v
```

Satırlar akış kontrolü olmadan sırayla çalışır; bu yüzden pencerelerin açılmasına zaman tanımak için `WAIT` kullanın.

## **Lisans**

MIT.
