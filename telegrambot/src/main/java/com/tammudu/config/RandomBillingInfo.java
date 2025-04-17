package com.tammudu.config;

import java.util.Random;

public class RandomBillingInfo {

    private static final Random random = new Random();

    public static String randomFirstName() {
        String[] names = {"John", "Mike", "David", "Chris", "James", "Robert"};
        return names[random.nextInt(names.length)];
    }

    public static String randomLastName() {
        String[] surnames = {"Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas"};
        return surnames[random.nextInt(surnames.length)];
    }

    public static String randomAddress() {
        return (100 + random.nextInt(899)) + " Elm Street";
    }

    public static String randomCity() {
        String[] cities = {"Los Angeles", "Chicago", "Miami", "Dallas", "Houston"};
        return cities[random.nextInt(cities.length)];
    }

    public static String randomZip() {
        int zip = 90000 + random.nextInt(999);
        return String.valueOf(zip);
    }

    public static String randomPhone() {
        int num = 1000000 + random.nextInt(9000000);
        return "213" + num; // 213 area code (Los Angeles)
    }

    public static String randomEmail() {
        return "duck" + (1000 + random.nextInt(9000)) + "@example.com";
    }

    public static String randomStateCode() {
        String[] states = {"CA", "NY", "TX", "FL", "AZ"};
        return states[random.nextInt(states.length)];
    }

    public static String randomDynSessConf() {
        return String.valueOf(-1 * (Math.abs(random.nextLong()))); // Random negative session ID
    }
}
