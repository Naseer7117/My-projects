package com.tammudu.files;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;

import java.util.HashMap;
import java.util.Map;

public class PaymentService {
    // Your Stripe Secret Key (use environment variables for production)
    private static final String STRIPE_SECRET_KEY = "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";

    static {
        Stripe.apiKey = STRIPE_SECRET_KEY;  // Initialize Stripe with your secret key
    }
    public static String chargeCardMultipleTimesWithWrongCVV(String tokenId) throws StripeException {
        // Try to charge the card 7 times with wrong CVV
        String result = "Charging card 7 times with wrong CVV:\n";
        for (int i = 1; i <= 7; i++) {
            try {
                result += "Attempt " + i + ": " + processPaymentWithWrongCVV(tokenId) + "\n";
            } catch (Exception e) {
                result += "Attempt " + i + ": Error - " + e.getMessage() + "\n";
            }
        }
        return result;
    }
    private static String processPaymentWithWrongCVV(String tokenId) throws StripeException {
        // Process the payment with the token using an incorrect CVV
        Map<String, Object> chargeParams = new HashMap<>();
        chargeParams.put("amount", 500);  // $5.00 (in cents)
        chargeParams.put("currency", "usd");
        chargeParams.put("source", tokenId);  // Use the token passed from the frontend
        chargeParams.put("description", "Payment for service");

        try {
            Charge charge = Charge.create(chargeParams);
            if (charge.getStatus().equals("succeeded")) {
                return "✅ Payment successful!";
            } else {
                return "❌ Payment failed (incorrect CVV).";
            }
        } catch (StripeException e) {
            // Handle CVV failure, return the error message
            return "❌ Payment failed (incorrect CVV). Error: " + e.getMessage();
        }
    }
}
