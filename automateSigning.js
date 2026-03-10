// const { Builder, By, until } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');
// const path = require('path');
// const fs = require('fs');
// const os = require('os');

// let driver;

// // const proxy = 'http://localhost:3000';

// // Configure Chrome options
// const options = new chrome.Options();
// // options.addArguments('--headless');
// // options.addArguments(`--proxy-server=${proxy}`);

// //options.addArguments('start-maximized');
// //options.addArguments('disable-infobars');
// //options.addArguments('disable-extensions');
// // options.addArguments('disable-gpu');

// // ✅ Best practical approach: fresh profile per run (prevents Diia widget state corruption)
// const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diia-selenium-'));
// console.log('Chrome profile:', profileDir);

// options.addArguments(
//   '--window-size=1600,900',
//   '--disable-extensions',
//   '--disable-infobars',
//   '--no-first-run',
//   '--no-default-browser-check',
//   '--disable-background-networking',
//   '--disable-background-timer-throttling',
//   '--disable-renderer-backgrounding',
//   '--disable-backgrounding-occluded-windows',
//   // '--user-data-dir=/tmp/selenium-visible-profile',
//   // `--user-data-dir=${profileDir}`,
//   '--profile-directory=Default'
// );
// // options.detachDriver(true);

// // Define the path to the file to be uploaded and the password
// const filePath = path.join(__dirname, 'pb_3247112235.jks'); // my
// // const filePath = path.join(__dirname, 'pb_3351001200.jks'); //Ira

// const documentToSignPath = '/Users/serhiikurylenko/Downloads/file-to-safe.txt'; // Update this path
// // const downloadedFilePath = 'C:\\Users\\Service\\Downloads\\file-to-safe.txt.p7s';
// const baseFileName = 'file-to-safe.txt';
// const password = '1234Azxcvbnm'; //my
// // const password = 'jE6yvK1uyC'; //Ira

// // async function initDriver() {
// //   // Initialize the ChromeDriver
// //   driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
// // }

// async function initDriver() {
//   if (driver) return driver;

//   driver = await new Builder()
//     .forBrowser('chrome')
//     .setChromeOptions(options)
//     // Selenium Manager automatically used (2026 default)
//     .build();

//   // 🔥 CDP warm-up (дуже важливо)
//   await driver.get('about:blank');

//   return driver;
// }

// async function restartProcess() {
//   console.log('Restarting process...');
//   await automateSigning(); // Restart the process
// }

// async function automateSigning() {
//   // Initialize the ChromeDriver
//   if (!driver) {
//     await initDriver(); // Ensure driver is initialized
//   }

//   try {
//     // Navigate to the Diia page
//     await driver.get('https://ca.diia.gov.ua/sign');

//     // Wait for the iframe to be present and switch to it
//     let iframe = await driver.wait(until.elementLocated(By.id('sign-widget')), 15000);
//     await driver.switchTo().frame(iframe);

//     let pkTypesBlock = await driver.wait(
//       until.elementLocated(By.id('pkTypesPreSelectBlock')),
//       10000
//     );

//     // Find all MenuItem elements inside the block
//     let menuItems = await pkTypesBlock.findElements(By.css('.MenuItem'));

//     if (menuItems.length > 0) {
//       console.log('Found MenuItem elements');

//       // Click the first MenuItem element
//       let firstMenuItem = menuItems[0];
//       try {
//         if (await firstMenuItem.isDisplayed()) {
//           console.log('First MenuItem found and is visible');

//           // Change background color to red using JavaScript
//           await driver.executeScript("arguments[0].style.backgroundColor = 'red';", firstMenuItem);

//           // Click the first MenuItem
//           await firstMenuItem.click();
//           console.log('Clicked the first MenuItem');

//           // Wait for the page to fully load before proceeding
//           await driver.sleep(5000); // Increased sleep time to 10 seconds

//           // Upload the file
//           let fileInput = await driver.wait(until.elementLocated(By.id('pkReadFileInput')), 5000);
//           await fileInput.sendKeys(filePath);
//           console.log('File uploaded');

//           // ✅ чекати, поки UI обробить файл і зʼявиться alias
//           await driver.wait(until.elementLocated(By.id('pkReadFileSelectAliasBlock')), 15000);

//           await driver.wait(
//             until.elementIsVisible(await driver.findElement(By.id('pkReadFileSelectAliasBlock'))),
//             15000
//           );

//           console.log('Alias block appeared – file fully loaded');

//           // Enter the password
//           let passwordInput = await driver.wait(
//             until.elementLocated(By.id('pkReadFilePasswordTextField')),
//             2000
//           );
//           await driver.executeScript("arguments[0].removeAttribute('disabled');", passwordInput); // Remove 'disabled' attribute if necessary
//           await passwordInput.sendKeys(password);
//           console.log('Password entered');

//           // Wait for the button to be enabled
//           let readButton = await driver.wait(until.elementLocated(By.id('pkReadFileButton')), 2000);
//           await driver.wait(until.elementIsEnabled(readButton), 2000);

//           // Click the "Зчитати" button using JavaScript if normal click doesn't work
//           await driver.executeScript('arguments[0].click();', readButton);
//           console.log('Clicked the "Зчитати" button');

//           // Wait for additional time after clicking "Зчитати" button
//           await driver.sleep(5000); // Increased sleep time to 15 seconds

//           // Wait until dimmerViewBlock is no longer visible
//           let dimmerViewBlock = await driver.wait(
//             until.elementLocated(By.id('dimmerViewBlock')),
//             10000
//           );
//           await driver.wait(until.elementIsNotVisible(dimmerViewBlock), 10000);
//           console.log('Dimmer view block is no longer visible');

//           // Click the "Далі" button
//           let nextButton = await driver.wait(until.elementLocated(By.id('pkInfoNextButton')), 2000);
//           await driver.wait(until.elementIsEnabled(nextButton), 2000);
//           await driver.executeScript('arguments[0].click();', nextButton);
//           console.log('Clicked the "Далі" button');

//           // Wait for 3 seconds
//           await driver.sleep(3000); // Wait for 3 seconds

//           // Click the "Ні, обрати інший формат" button
//           let backButton = await driver.wait(
//             until.elementLocated(By.id('preSignBackButton')),
//             2000
//           );
//           await driver.wait(until.elementIsEnabled(backButton), 2000);
//           await driver.executeScript('arguments[0].click();', backButton);
//           console.log('Clicked the "Ні, обрати інший формат" button');

//           // Wait for 3 seconds after clicking the backButton
//           await driver.sleep(3000); // Wait for 3 seconds

//           // Click the CAdES radio button
//           let cadesRadio = await driver.wait(
//             until.elementLocated(By.id('signTypeCAdESRadioInput')),
//             2000
//           );
//           await driver.executeScript('arguments[0].scrollIntoView();', cadesRadio); // Scroll into view if necessary
//           await driver.wait(until.elementIsEnabled(cadesRadio), 2000);
//           await cadesRadio.click();
//           console.log('Clicked the CAdES radio button');

//           // Upload the file for signing
//           let signFileInput = await driver.wait(
//             until.elementLocated(By.id('signFilesInput')),
//             2000
//           );

//           await signFileInput.sendKeys(documentToSignPath);
//           console.log('File uploaded for signing');

//           // Click the "Підписати" (Sign) button
//           let signButton = await driver.wait(until.elementLocated(By.id('signButton')), 2000);
//           await driver.wait(until.elementIsEnabled(signButton), 2000);
//           await driver.executeScript('arguments[0].click();', signButton);
//           console.log('Clicked the "Підписати" button');

//           // Wait until dimmerViewBlock is no longer visible after signing
//           let dimmerViewBlockAfterSign = await driver.wait(
//             until.elementLocated(By.id('dimmerViewBlock')),
//             2000
//           );
//           await driver.wait(until.elementIsNotVisible(dimmerViewBlockAfterSign), 2000);
//           console.log('Dimmer view block is no longer visible after signing');

//           // Click the "Файл з підписом" button
//           let saveSignFileButton = await driver.wait(
//             until.elementLocated(By.id('saveSignFileButton')),
//             2000
//           );
//           await driver.wait(until.elementIsEnabled(saveSignFileButton), 2000);
//           await driver.executeScript('arguments[0].click();', saveSignFileButton);
//           console.log('Clicked the "Файл з підписом" button');

//           const downloadedFilePath = await waitForFileDownload(baseFileName);

//           console.log('File downloaded successfully at:', downloadedFilePath);

//           let backToSigningButton = await driver.wait(
//             until.elementLocated(By.id('resultOKButton'), 2000)
//           );
//           await driver.executeScript('arguments[0].click();', backToSigningButton);
//           console.log('Clicked the "Дякую');

//           // // Open Base64 conversion URL in a new tab
//           // await driver.executeScript(
//           //   "window.open('https://base64.guru/converter/encode/file', '_blank');"
//           // );

//           // // Switch to the new tab
//           // let handles = await driver.getAllWindowHandles();
//           // await driver.switchTo().window(handles[1]);

//           // // ----

//           // await driver.sleep(10000); // чекаємо 10 секунд, щоб сайт точно завантажився

//           // let currentUrl = await driver.getCurrentUrl();
//           // console.log("Opened URL:", currentUrl);

//           // // якщо сайт не підвантажив форму — оновити сторінку
//           // if (!currentUrl.includes("base64.guru")) {
//           //   await driver.get("https://base64.guru/converter/encode/file");
//           // }
//           // // ----

//           // // Upload the file to the Base64 converter
//           // let base64FileInput = await driver.wait(
//           //   until.elementLocated(
//           //     By.id("form-base64-converter-encode-file-file")
//           //   ),
//           //   20000
//           // );
//           // await base64FileInput.sendKeys(downloadedFilePath);
//           // console.log("Uploaded the file to Base64 converter");

//           // // Click the "Encode file to Base64" button
//           // let encodeButton = await driver.wait(
//           //   until.elementLocated(
//           //     By.id("form-base64-converter-encode-file-encode")
//           //   ),
//           //   20000
//           // );
//           // await driver.wait(until.elementIsEnabled(encodeButton), 20000);
//           // await driver.executeScript("arguments[0].click();", encodeButton);
//           // console.log('Clicked the "Encode file to Base64" button');

//           // await driver.sleep(5000); // Wait for 5 seconds

//           // // Click the "copy" link
//           // let copyLink = await driver.wait(
//           //   until.elementLocated(By.xpath("//a[text()='copy']")),
//           //   20000
//           // );
//           // await driver.wait(until.elementIsEnabled(copyLink), 20000);
//           // await copyLink.click();
//           // console.log('Clicked the "copy" link');

//           // let base64TextArea = await driver.wait(
//           //   until.elementLocated(
//           //     By.id("form-base64-converter-encode-file-base64")
//           //   ),
//           //   20000
//           // );
//           // let base64Text = await base64TextArea.getAttribute("value");
//           const base64Data = fs.readFileSync(downloadedFilePath, { encoding: 'base64' });

//           console.log('Base64 encoded text:', base64Data);

//           // await driver.close();
//           // await driver.switchTo().window(handles[0]);
//           // console.log("Base64 converter tab closed");

//           return base64Data;
//         } else {
//           console.log('First MenuItem is not visible');
//         }
//       } catch (e) {
//         console.error('Error while clicking the first MenuItem:', e);
//       }
//     } else {
//       console.log('No MenuItem elements found');
//       await restartProcess();
//     }
//   } catch (error) {
//     console.error('An error occurred:', error);
//   } finally {
//     // if (driver) {
//     //   console.log('Closing browser...');
//     //   await driver.quit();
//     //   driver = null;
//     // }
//   }

//   // Do not close the driver to keep the browser window open
//   //   await driver.quit(); // Comment this line to keep the browser open
// }

// async function waitForFileDownload(baseFileName) {
//   return new Promise((resolve, reject) => {
//     const checkInterval = 1000; // Перевіряти кожну 1 секунду
//     const maxWait = 60000; // Максимальний час очікування 60 секунд
//     let elapsedTime = 0;
//     let latestFilePath = null;

//     const interval = setInterval(() => {
//       let maxIndex = 0;
//       let foundFilePath = null;

//       // Перевірити наявність файлів з можливими динамічними іменами
//       for (let i = 1; i <= 100; i++) {
//         const fileName = `${baseFileName} (${i}).p7s`;
//         const filePath = path.join('/Users/serhiikurylenko/Downloads', fileName);

//         if (fs.existsSync(filePath)) {
//           console.log('Знайдено файл:', fileName);
//           if (i > maxIndex) {
//             maxIndex = i;
//             foundFilePath = filePath;
//           }
//         }
//       }

//       if (foundFilePath) {
//         // Видалити попередній файл, якщо він існує
//         if (latestFilePath && fs.existsSync(latestFilePath)) {
//           fs.unlinkSync(latestFilePath);
//           console.log('Попередній файл видалено:', latestFilePath);
//         }
//         latestFilePath = foundFilePath;
//         clearInterval(interval);
//         resolve(latestFilePath);
//       } else {
//         elapsedTime += checkInterval;
//         if (elapsedTime >= maxWait) {
//           clearInterval(interval);
//           reject(new Error('Час очікування файлу вичерпано'));
//         }
//       }
//     }, checkInterval);
//   });
// }

// module.exports = {
//   automateSigning,
// };

// // -------------------- SHUTDOWN / CLEANUP --------------------
// async function shutdown() {
//   try {
//     if (driver) {
//       console.log('Gracefully closing browser...');
//       await driver.quit();
//       driver = null;
//     }
//   } catch (e) {
//     console.error('Error during driver quit:', e);
//   } finally {
//     // ✅ cleanup profile (keeps /tmp clean)
//     try {
//       fs.rmSync(profileDir, { recursive: true, force: true });
//       console.log('Deleted Chrome profile:', profileDir);
//     } catch (e) {
//       console.error('Failed to delete profile dir:', e);
//     }
//     process.exit(0);
//   }
// }

// process.on('SIGINT', shutdown);
// process.on('SIGTERM', shutdown);
// process.on('exit', () => {
//   // "exit" event cannot await; best-effort cleanup
//   try {
//     fs.rmSync(profileDir, { recursive: true, force: true });
//   } catch {}
// });

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadEnv, requireEnv } = require('./utils/env');
const { getSavePath, getSourceFilename } = require('./utils/fileHelpers');

let driver;

loadEnv();

// -------------------- CHROME OPTIONS --------------------
const options = new chrome.Options();

// ✅ Fresh profile per run (prevents Diia widget state corruption)
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diia-selenium-'));
console.log('Chrome profile:', profileDir);

// ✅ (Не ламає логіку) — фіксуємо download dir, щоб очікування файлу було стабільним
const downloadsDir = getSavePath();
options.setUserPreferences({
  'download.default_directory': downloadsDir,
  'download.prompt_for_download': false,
  'download.directory_upgrade': true,
  'safebrowsing.enabled': true,
});

options.addArguments(
  '--window-size=1600,900',
  '--disable-extensions',
  '--disable-infobars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  `--user-data-dir=${profileDir}`,
  '--profile-directory=Default'
);

// -------------------- INPUTS --------------------
const defaultKeyPath = path.join(__dirname, 'pb_3247112235.jks'); // my
// const password = 'jE6yvK1uyC'; //Ira

if (String(process.env.SIGNING_HEADLESS || '').toLowerCase() === 'true') {
  options.addArguments('--headless=new');
}

// -------------------- DRIVER INIT --------------------
async function initDriver() {
  if (driver) return driver;

  driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  // 🔥 CDP warm-up (інколи лікує підвисання/стани у віджеті)
  await driver.get('about:blank');
  return driver;
}

// -------------------- PROCESS CONTROL --------------------
async function restartProcess() {
  console.log('Restarting process...');
  // важливо: перед рестартом вийти з iframe/alert-станів
  try {
    await driver.switchTo().defaultContent();
  } catch {}
  return automateSigning();
}

async function automateSigning() {
  if (!driver) await initDriver();

  try {
    const configuredKeyPath = process.env.SIGNING_KEY_FILE || defaultKeyPath;
    const documentToSignPath = path.join(downloadsDir, getSourceFilename());
    const baseFileName = getSourceFilename();
    const password = requireEnv('SIGNING_KEY_PASSWORD');

    // Navigate to the Diia page
    await driver.get('https://ca.diia.gov.ua/sign');

    // Wait for the iframe to be present and switch to it
    const iframe = await driver.wait(until.elementLocated(By.id('sign-widget')), 15000);
    await driver.switchTo().frame(iframe);

    const pkTypesBlock = await driver.wait(
      until.elementLocated(By.id('pkTypesPreSelectBlock')),
      10000
    );

    const menuItems = await pkTypesBlock.findElements(By.css('.MenuItem'));

    if (!menuItems.length) {
      console.log('No MenuItem elements found');
      return restartProcess();
    }

    console.log('Found MenuItem elements');

    const firstMenuItem = menuItems[0];

    if (!(await firstMenuItem.isDisplayed())) {
      console.log('First MenuItem is not visible');
      return restartProcess();
    }

    console.log('First MenuItem found and is visible');

    await driver.executeScript("arguments[0].style.backgroundColor = 'red';", firstMenuItem);
    await firstMenuItem.click();
    console.log('Clicked the first MenuItem');

    await driver.sleep(5000);

    // Upload the key file
    const fileInput = await driver.wait(until.elementLocated(By.id('pkReadFileInput')), 15000);
    await fileInput.sendKeys(configuredKeyPath);
    console.log('File uploaded');

    // ✅ wait until alias block is present & visible
    const aliasBlock = await driver.wait(
      until.elementLocated(By.id('pkReadFileSelectAliasBlock')),
      15000
    );
    await driver.wait(until.elementIsVisible(aliasBlock), 15000);
    console.log('Alias block appeared – file fully loaded');

    // Enter the password
    const passwordInput = await driver.wait(
      until.elementLocated(By.id('pkReadFilePasswordTextField')),
      15000
    );
    await driver.executeScript("arguments[0].removeAttribute('disabled');", passwordInput);
    await passwordInput.sendKeys(password);
    console.log('Password entered');

    // Click "Зчитати"
    const readButton = await driver.wait(until.elementLocated(By.id('pkReadFileButton')), 15000);
    await driver.wait(until.elementIsEnabled(readButton), 15000);
    await driver.executeScript('arguments[0].click();', readButton);
    console.log('Clicked the "Зчитати" button');

    await driver.sleep(5000);

    // Wait until dimmer is not visible
    const dimmerViewBlock = await driver.wait(
      until.elementLocated(By.id('dimmerViewBlock')),
      15000
    );
    await driver.wait(until.elementIsNotVisible(dimmerViewBlock), 15000);
    console.log('Dimmer view block is no longer visible');

    // Click "Далі"
    const nextButton = await driver.wait(until.elementLocated(By.id('pkInfoNextButton')), 15000);
    await driver.wait(until.elementIsEnabled(nextButton), 15000);
    await driver.executeScript('arguments[0].click();', nextButton);
    console.log('Clicked the "Далі" button');

    await driver.sleep(3000);

    // Click "Ні, обрати інший формат"
    const backButton = await driver.wait(until.elementLocated(By.id('preSignBackButton')), 15000);
    await driver.wait(until.elementIsEnabled(backButton), 15000);
    await driver.executeScript('arguments[0].click();', backButton);
    console.log('Clicked the "Ні, обрати інший формат" button');

    await driver.sleep(3000);

    // Select CAdES
    const cadesRadio = await driver.wait(
      until.elementLocated(By.id('signTypeCAdESRadioInput')),
      15000
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', cadesRadio);
    await driver.wait(until.elementIsEnabled(cadesRadio), 15000);
    await cadesRadio.click();
    console.log('Clicked the CAdES radio button');

    // Upload file to sign
    const signFileInput = await driver.wait(until.elementLocated(By.id('signFilesInput')), 15000);
    await signFileInput.sendKeys(documentToSignPath);
    console.log('File uploaded for signing');

    // Click "Підписати"
    const signButton = await driver.wait(until.elementLocated(By.id('signButton')), 15000);
    await driver.wait(until.elementIsEnabled(signButton), 15000);
    await driver.executeScript('arguments[0].click();', signButton);
    console.log('Clicked the "Підписати" button');

    // Wait until dimmer is not visible after signing
    const dimmerViewBlockAfterSign = await driver.wait(
      until.elementLocated(By.id('dimmerViewBlock')),
      15000
    );
    await driver.wait(until.elementIsNotVisible(dimmerViewBlockAfterSign), 15000);
    console.log('Dimmer view block is no longer visible after signing');

    // Click "Файл з підписом"
    const saveSignFileButton = await driver.wait(
      until.elementLocated(By.id('saveSignFileButton')),
      15000
    );
    await driver.wait(until.elementIsEnabled(saveSignFileButton), 15000);
    await driver.executeScript('arguments[0].click();', saveSignFileButton);
    console.log('Clicked the "Файл з підписом" button');

    const downloadedFilePath = await waitForFileDownload(baseFileName, downloadsDir);
    console.log('File downloaded successfully at:', downloadedFilePath);

    // ✅ BUGFIX: тут у тебе були дужки не там, через це driver.wait отримував неправильні аргументи
    const backToSigningButton = await driver.wait(
      until.elementLocated(By.id('resultOKButton')),
      15000
    );
    await driver.executeScript('arguments[0].click();', backToSigningButton);
    console.log('Clicked the "Дякую"');

    const base64Data = fs.readFileSync(downloadedFilePath, { encoding: 'base64' });
    console.log('Base64 encoded text:', base64Data);

    return base64Data;
  } catch (error) {
    console.error('An error occurred:', error);
    // якщо хочеш — можна рестартити тільки на конкретних помилках,
    // але я не міняю логіку: просто повертаємося як зараз
    // return restartProcess();
  } finally {
    // intentionally keep browser open (як у тебе)
  }
}

// -------------------- DOWNLOAD WAIT --------------------
// ✅ (Не ламає логіку) — додав пошук також для "baseFileName.p7s" без (i)
// ✅ (Не ламає логіку) — додаємо перевірку що файл перестав рости (щоб не читати недокачаний)
async function waitForFileDownload(baseFileName, dir) {
  const candidates = [];

  // базовий варіант без (i)
  candidates.push(path.join(dir, `${baseFileName}.p7s`));

  // динамічні (1..100)
  for (let i = 1; i <= 100; i++) {
    candidates.push(path.join(dir, `${baseFileName} (${i}).p7s`));
  }

  const checkInterval = 500;
  const maxWait = 60000;
  const stableForMs = 1200;

  const start = Date.now();
  let lastSeen = null; // { path, size, ts }

  while (Date.now() - start < maxWait) {
    // знайти "найновіший" існуючий кандидат
    let found = null;

    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      const stat = fs.statSync(p);
      if (!found || stat.mtimeMs > found.mtimeMs) {
        found = { path: p, mtimeMs: stat.mtimeMs, size: stat.size };
      }
    }

    if (found) {
      if (lastSeen && lastSeen.path === found.path) {
        // файл той самий: чекаємо стабілізації розміру
        if (found.size === lastSeen.size) {
          if (Date.now() - lastSeen.ts >= stableForMs) {
            return found.path;
          }
        } else {
          lastSeen = { path: found.path, size: found.size, ts: Date.now() };
        }
      } else {
        // інший файл або перший раз
        lastSeen = { path: found.path, size: found.size, ts: Date.now() };
      }
    }

    await new Promise((r) => setTimeout(r, checkInterval));
  }

  throw new Error('Час очікування файлу вичерпано');
}

module.exports = { automateSigning };

// -------------------- SHUTDOWN / CLEANUP --------------------
async function shutdown() {
  try {
    if (driver) {
      console.log('Gracefully closing browser...');
      await driver.quit();
      driver = null;
    }
  } catch (e) {
    console.error('Error during driver quit:', e);
  } finally {
    // ✅ cleanup profile (keeps /tmp clean)
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
      console.log('Deleted Chrome profile:', profileDir);
    } catch (e) {
      console.error('Failed to delete profile dir:', e);
    }
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => {
  // "exit" event cannot await; best-effort cleanup
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {}
});
