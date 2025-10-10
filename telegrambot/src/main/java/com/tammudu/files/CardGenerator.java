package com.tammudu.files;

import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Utility for generating card numbers, expiry dates, and CVVs based on a BIN.
 */
public final class CardGenerator {

    private static final int TARGET_CARD_LENGTH = 16;
    public static final int MAX_YEARS_AHEAD = 6;

    private CardGenerator() {
    }

    public static String generateBatch(String bin, int quantity, ExpirySpec expirySpec) {
        if (bin == null || bin.isBlank()) {
            throw new IllegalArgumentException("BIN must not be empty.");
        }
        String digitsOnly = bin.replaceAll("\\D", "");
        if (digitsOnly.length() < 6 || digitsOnly.length() >= TARGET_CARD_LENGTH) {
            throw new IllegalArgumentException("BIN length must be between 6 and 15 digits.");
        }

        ExpirySpec spec = expirySpec == null ? ExpirySpec.random() : expirySpec;

        StringBuilder builder = new StringBuilder(Math.max(quantity * 25, 64));
        for (int i = 0; i < quantity; i++) {
            if (i > 0) {
                builder.append('\n');
            }
            String cardNumber = generateCardNumber(digitsOnly);
            YearMonth expiry = randomExpiry(spec);
            String cvv = randomCvv(cardNumber.charAt(0));
            builder.append(cardNumber)
                    .append('|')
                    .append(formatMonth(expiry))
                    .append('|')
                    .append(formatYear(expiry))
                    .append('|')
                    .append(cvv);
        }
        return builder.toString();
    }

    public static ExpirySpec randomSpec() {
        return ExpirySpec.random();
    }

    public static ExpirySpec rangeSpec(YearMonth start, YearMonth end) {
        return ExpirySpec.ofRange(start, end);
    }

    private static String generateCardNumber(String bin) {
        StringBuilder number = new StringBuilder(bin);
        int digitsNeeded = TARGET_CARD_LENGTH - 1 - bin.length();
        if (digitsNeeded < 0) {
            throw new IllegalArgumentException("BIN is too long to generate a 16-digit card.");
        }
        ThreadLocalRandom random = ThreadLocalRandom.current();
        for (int i = 0; i < digitsNeeded; i++) {
            number.append(random.nextInt(10));
        }
        int checkDigit = calculateLuhnCheckDigit(number.toString());
        number.append(checkDigit);
        return number.toString();
    }

    private static int calculateLuhnCheckDigit(String numberWithoutCheckDigit) {
        int sum = 0;
        boolean doubleDigit = true;
        for (int i = numberWithoutCheckDigit.length() - 1; i >= 0; i--) {
            int digit = numberWithoutCheckDigit.charAt(i) - '0';
            if (doubleDigit) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            doubleDigit = !doubleDigit;
        }
        return (10 - (sum % 10)) % 10;
    }

    private static YearMonth randomExpiry(ExpirySpec spec) {
        YearMonth now = YearMonth.now();
        YearMonth start = spec.isRandom() ? now : spec.start();
        YearMonth end = spec.isRandom() ? now.plusYears(MAX_YEARS_AHEAD) : spec.end();

        if (start.isBefore(now)) {
            start = now;
        }
        YearMonth max = now.plusYears(MAX_YEARS_AHEAD);
        if (end.isAfter(max)) {
            end = max;
        }
        if (end.isBefore(start)) {
            end = start;
        }

        long monthsBetween = ChronoUnit.MONTHS.between(start, end);
        int offset = monthsBetween == 0 ? 0 : ThreadLocalRandom.current().nextInt((int) monthsBetween + 1);
        return start.plusMonths(offset);
    }

    private static String randomCvv(char firstDigit) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        if (firstDigit == '3') {
            return String.format("%04d", random.nextInt(10000));
        }
        return String.format("%03d", random.nextInt(1000));
    }

    private static String formatMonth(YearMonth yearMonth) {
        return String.format("%02d", yearMonth.getMonthValue());
    }

    private static String formatYear(YearMonth yearMonth) {
        return String.format("%02d", yearMonth.getYear() % 100);
    }

    public static final class ExpirySpec {
        private final YearMonth start;
        private final YearMonth end;

        private ExpirySpec(YearMonth start, YearMonth end) {
            this.start = start;
            this.end = end;
        }

        public static ExpirySpec random() {
            return new ExpirySpec(null, null);
        }

        public static ExpirySpec ofRange(YearMonth start, YearMonth end) {
            if (start == null || end == null) {
                throw new IllegalArgumentException("Start and end must be provided for an expiry range.");
            }
            if (end.isBefore(start)) {
                throw new IllegalArgumentException("Expiry end must be after start.");
            }
            return new ExpirySpec(start, end);
        }

        public boolean isRandom() {
            return start == null || end == null;
        }

        public YearMonth start() {
            return start;
        }

        public YearMonth end() {
            return end;
        }

        @Override
        public String toString() {
            if (isRandom()) {
                return "RND";
            }
            return String.format("%02d/%02d to %02d/%02d",
                    start.getMonthValue(),
                    start.getYear() % 100,
                    end.getMonthValue(),
                    end.getYear() % 100);
        }
    }
}
