package telegram.files;


import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import telegram.files.repository.FileRecord;

public class UpdateFileDownloadProcess {

    public static void main(String[] args) {
        if (args.length < 5) {
            System.out.println("Usage: UpdateFileDownloadProcess <fileId> <uniqueId> <localPath> <downloadStatus> <completionDate>");
            System.exit(1);
        }
        System.out.println("Process: " + ProcessHandle.current().pid() + " started");

        int fileId = Integer.parseInt(args[0]);
        String uniqueId = args[1];
        String localPath = args[2];
        String downloadStatus = args[3];
        Long completionDate = Long.parseLong(args[4]);

        try {
            Vertx vertx = Vertx.vertx();
            Future<String> deployVerticle = vertx.deployVerticle(new DataVerticle());
            MessyUtils.await(deployVerticle);

            Future<JsonObject> future = DataVerticle.fileRepository.updateDownloadStatus(fileId,
                    uniqueId,
                    localPath,
                    FileRecord.DownloadStatus.valueOf(downloadStatus),
                    completionDate);
            MessyUtils.await(future);
            System.out.println("Process: " + ProcessHandle.current().pid() + " finished");
            System.exit(0);
        } catch (Exception e) {
            System.out.println("Process: " + ProcessHandle.current().pid() + " failed");
            e.printStackTrace();
            System.exit(1);
        }
    }

}
