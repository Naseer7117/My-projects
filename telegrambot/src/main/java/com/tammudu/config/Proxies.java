package com.tammudu.files;

import java.util.ArrayList;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;

public class Proxies {

    private static volatile boolean useProxy = true; // ✅ MAKE IT VOLATILE

    public static class ProxyInfo {
        public String host;
        public int port;
        public String username;
        public String password;

        public ProxyInfo(String host, int port, String username, String password) {
            this.host = host;
            this.port = port;
            this.username = username;
            this.password = password;
        }
    }

    public static boolean isProxyEnabled() {
        return useProxy;
    }

    public static void enableProxy() {
        useProxy = true;
    }

    public static void disableProxy() {
        useProxy = false;
    }

    public static List<ProxyInfo> loadProxies() {
        List<ProxyInfo> proxies = new ArrayList<>();
        try {
            List<String> lines = Files.readAllLines(Path.of("proxies.txt"), StandardCharsets.UTF_8);
            for (String line : lines) {
                String[] parts = line.split(":");
                if (parts.length >= 2) {
                    String host = parts[0];
                    int port = Integer.parseInt(parts[1]);
                    String username = parts.length >= 3 ? parts[2] : "";
                    String password = parts.length >= 4 ? parts[3] : "";
                    proxies.add(new ProxyInfo(host, port, username, password));
                }
            }
        } catch (Exception e) {
            System.out.println("Error loading proxies.txt: " + e.getMessage());
        }
        return proxies;
    }
}
