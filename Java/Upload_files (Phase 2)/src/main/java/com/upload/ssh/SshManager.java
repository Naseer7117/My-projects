package com.upload.ssh;

import java.io.IOException;

public class SshManager {
    private static Process sshProcess;

    public static void startTunnel(String keyPath, String user, String host, int localPort, int remotePort) {
        String command = String.format(
            "ssh -N -i \"%s\" -o StrictHostKeyChecking=no -L %d:localhost:%d %s@%s",
            keyPath, localPort, remotePort, user, host
        );

        try {
            sshProcess = new ProcessBuilder("cmd.exe", "/c", command)
                .inheritIO()
                .start();

            System.out.println("🔓 SSH tunnel started.");
            Thread.sleep(5000); // wait for the tunnel to establish

        } catch (IOException | InterruptedException e) {
            System.err.println("❌ Failed to start SSH tunnel: " + e.getMessage());
        }
    }

    public static void stopTunnel() {
        if (sshProcess != null && sshProcess.isAlive()) {
            sshProcess.destroy();
            System.out.println("🔒 SSH tunnel closed.");
        }
    }
}
