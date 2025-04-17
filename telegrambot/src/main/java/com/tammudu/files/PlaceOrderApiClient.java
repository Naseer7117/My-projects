package com.tammudu.files;

import okhttp3.*;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class PlaceOrderApiClient {

    private static final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .writeTimeout(5, TimeUnit.SECONDS)
            .readTimeout(6, TimeUnit.SECONDS)
            .build();

    public static String submitPlaceOrderApi(String cardNumber, String expMonth, String expYear, String cvv, String cookies, String csrfToken) {
        String fullYear = expYear.length() == 2 ? "20" + expYear : expYear;

        FormBody formBody = new FormBody.Builder()
                .add("_DARGS", "/checkout/billing_review.jsp.billingReviewForm")
                .add("_dyncharset", "UTF-8")
                .add("_dynSessConf", csrfToken)
                .add("cardSelect", "FDPYT1001")
                .add("cc_number", cardNumber)
                .add("_D:cc_number", "")
                .add("cc_number_hidden", cardNumber)
                .add("_D:cc_number_hidden", "")
                .add("ccType", "VI")
                .add("_D:ccType", "")
                .add("ccpaymentTypeId", "FDPYT1001")
                .add("_D:ccpaymentTypeId", "")
                .add("ccTypeVal", "VI")
                .add("is_cvv_required", "true")
                .add("cvv_number", cvv)
                .add("_D:cvv_number", "")
                .add("cc_month", expMonth)
                .add("_D:cc_month", "")
                .add("cc_year", fullYear)
                .add("_D:cc_year", "")
                .add("_D:first_name", "")
                .add("_D:last_name", "")
                .add("_D:address1", "")
                .add("_D:address2", "")
                .add("_D:city", "")
                .add("_D:territory", "")
                .add("_D:zip", "")
                .add("_D:country", "")
                .add("_D:phone_number", "")
                .add("_D:email", "")
                .add("/atg/commerce/order/purchase/PaymentGroupFormHandler.optInMsgs", "optinViaEsat")
                .add("_D:/atg/commerce/order/purchase/PaymentGroupFormHandler.optInMsgs", "")
                .add("delivery-pickup-efsg162474347", "efsg162474347")
                .add("_D:delivery-pickup-efsg162474347", "")
                .add("/atg/commerce/order/purchase/PaymentGroupFormHandler.addPaymentGroupToOrderErrorURL", "billing_review.jsp")
                .add("_D:/atg/commerce/order/purchase/PaymentGroupFormHandler.addPaymentGroupToOrderErrorURL", "")
                .add("billingReviewSubBtn", "Submit")
                .add("_D:billingReviewSubBtn", "")
                .add("/atg/commerce/order/purchase/PaymentGroupFormHandler.addPaymentGroupToOrderSuccessURL", "/orderconfirmation?orderId=ef6265446989")
                .add("_D:/atg/commerce/order/purchase/PaymentGroupFormHandler.addPaymentGroupToOrderSuccessURL", "")
                .build();

        Request request = new Request.Builder()
                .url("https://www.suzanns.com/checkout/billing_review.jsp?_DARGS=/checkout/billing_review.jsp.billingReviewForm")
                .post(formBody)
                .addHeader("Content-Type", "application/x-www-form-urlencoded")
                .addHeader("Cookie", cookies)
                .addHeader("Origin", "https://www.suzanns.com")
                .addHeader("Referer", "https://www.suzanns.com/checkout/billing_review.jsp")
                .addHeader("User-Agent", "Mozilla/5.0")
                .build();

        try (Response response = client.newCall(request).execute()) {
            return response.isSuccessful() ? "✅ API submission succeeded: " + response.code()
                                           : "❌ API submission failed: " + response.code();
        } catch (IOException e) {
            return "❌ API request error: " + e.getMessage();
        }
    }
}
