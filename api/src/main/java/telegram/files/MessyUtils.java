package telegram.files;

import io.vertx.core.Future;

import java.io.File;
import java.io.FileInputStream;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

public class MessyUtils {

    public static LocalDateTime withGrouping5Minutes(LocalDateTime time) {
        int minute = time.getMinute();
        int minuteGroup = minute / 5;
        int newMinute = minuteGroup * 5;
        return time.withMinute(newMinute).withSecond(0).withNano(0);
    }

    public static String calculateFileMD5(File file) {
        try (FileInputStream fis = new FileInputStream(file);
             FileChannel channel = fis.getChannel()) {

            MappedByteBuffer buffer = channel.map(FileChannel.MapMode.READ_ONLY, 0, file.length());

            MessageDigest md = MessageDigest.getInstance("MD5");

            md.update(buffer);

            byte[] md5Bytes = md.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : md5Bytes) {
                hexString.append(String.format("%02x", b));
            }

            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean compareFilesMD5(File file1, File file2) {
        CompletableFuture<String> md5Task1 = CompletableFuture.supplyAsync(() -> {
            try {
                return calculateFileMD5(file1);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        CompletableFuture<String> md5Task2 = CompletableFuture.supplyAsync(() -> {
            try {
                return calculateFileMD5(file2);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        String md5File1 = md5Task1.join();
        String md5File2 = md5Task2.join();

        return md5File1.equals(md5File2);
    }

    public static <T> T await(Future<T> future) {
        CompletableFuture<T> completableFuture = new CompletableFuture<>();
        future.onComplete(result -> {
            if (result.succeeded()) {
                completableFuture.complete(result.result());
            } else {
                completableFuture.completeExceptionally(result.cause());
            }
        });
        return completableFuture.join();
    }
}
