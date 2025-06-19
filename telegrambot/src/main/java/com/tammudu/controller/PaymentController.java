package com.tammudu.controller;
import com.tammudu.files.*;

import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.stripe.exception.StripeException;

@RestController
public class PaymentController {

    @PostMapping("/charge")
    public Map<String, Object> charge(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");

        // Call the PaymentService to charge the card with the token
        try {
            String result = PaymentService.chargeCardMultipleTimesWithWrongCVV(token);
            return Map.of("success", true, "message", result);
        } catch (StripeException e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }
}
