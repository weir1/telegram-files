package telegram.files;

import cn.hutool.core.convert.Convert;
import cn.hutool.core.io.FileUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import telegram.files.repository.FileRecord;

import java.nio.file.Path;
import java.util.function.Consumer;

public abstract class Transfer {

    private static final Log log = LogFactory.get();

    public String destination;

    public DuplicationPolicy duplicationPolicy;

    public boolean transferHistory;

    public Consumer<TransferStatusUpdated> transferStatusUpdated;

    private FileRecord transferRecord;

    public static Transfer create(TransferPolicy transferPolicy) {
        return switch (transferPolicy) {
            case GROUP_BY_CHAT -> new GroupByChat();
            case GROUP_BY_TYPE -> new GroupByType();
        };
    }

    public void transfer(FileRecord fileRecord) {
        log.debug("Start transfer file {}", fileRecord.id());
        transferRecord = fileRecord;
        transferStatusUpdated.accept(new TransferStatusUpdated(fileRecord, FileRecord.TransferStatus.transferring, null));
        try {
            String transferPath = getTransferPath(fileRecord);
            boolean isOverwrite = false;
            if (FileUtil.exist(transferPath)) {
                if (duplicationPolicy == DuplicationPolicy.SKIP) {
                    log.trace("Skip file {}", fileRecord.id());
                    transferStatusUpdated.accept(new TransferStatusUpdated(fileRecord, FileRecord.TransferStatus.idle, null));
                    return;
                }

                if (duplicationPolicy == DuplicationPolicy.OVERWRITE) {
                    log.trace("Overwrite file {}", fileRecord.id());
                    isOverwrite = true;
                }

                if (duplicationPolicy == DuplicationPolicy.RENAME) {
                    transferPath = getUniquePath(transferPath);
                    log.trace("Rename file {} to {}", fileRecord.id(), transferPath);
                }

                if (duplicationPolicy == DuplicationPolicy.HASH) {
                    if (MessyUtils.compareFilesMD5(FileUtil.file(fileRecord.localPath()), FileUtil.file(transferPath))) {
                        log.trace("File {} is the same as {}", fileRecord.id(), transferPath);
                        FileUtil.del(fileRecord.localPath());
                        transferStatusUpdated.accept(new TransferStatusUpdated(fileRecord, FileRecord.TransferStatus.completed, transferPath));
                        return;
                    } else {
                        transferPath = getUniquePath(transferPath);
                        log.trace("Rename file {} to {}", fileRecord.id(), transferPath);
                    }
                }
            }

            FileUtil.move(Path.of(fileRecord.localPath()), Path.of(transferPath), isOverwrite);
            log.info("Transfer file {} to {}, duplication policy: {} overwrite: {}", fileRecord.id(), transferPath, duplicationPolicy, isOverwrite);

            transferStatusUpdated.accept(new TransferStatusUpdated(fileRecord, FileRecord.TransferStatus.completed, transferPath));
        } catch (Exception e) {
            log.error(e, "Transfer file {} error", fileRecord.id());
            transferStatusUpdated.accept(new TransferStatusUpdated(fileRecord, FileRecord.TransferStatus.error, null));
        } finally {
            transferRecord = null;
        }
    }

    private String getUniquePath(String path) {
        if (!FileUtil.exist(path)) {
            return path;
        }
        String name = FileUtil.getName(path);
        String parent = FileUtil.getParent(path, 1);
        String extension = FileUtil.extName(name);
        String baseName = FileUtil.mainName(name);
        int i = 1;
        while (FileUtil.exists(Path.of(parent, "%s-%d.%s".formatted(baseName, i, extension)), false)) {
            i++;
        }
        return Path.of(parent, "%s-%d.%s".formatted(baseName, i, extension)).toString();
    }

    public FileRecord getTransferRecord() {
        return transferRecord;
    }

    protected abstract String getTransferPath(FileRecord fileRecord);

    static class GroupByChat extends Transfer {
        @Override
        protected String getTransferPath(FileRecord fileRecord) {
            String name = FileUtil.getName(fileRecord.localPath());
            return Path.of(destination,
                    Convert.toStr(fileRecord.telegramId()),
                    Convert.toStr(fileRecord.chatId()),
                    name
            ).toString();
        }
    }

    static class GroupByType extends Transfer {
        @Override
        protected String getTransferPath(FileRecord fileRecord) {
            String name = FileUtil.getName(fileRecord.localPath());
            return Path.of(destination,
                    fileRecord.type(),
                    name
            ).toString();
        }
    }

    public record TransferStatusUpdated(FileRecord fileRecord,
                                        FileRecord.TransferStatus transferStatus,
                                        String localPath) {
    }

    public enum TransferPolicy {
        /**
         * Transfer files by chat id
         */
        GROUP_BY_CHAT,
        /**
         * Transfer files by type
         */
        GROUP_BY_TYPE,
        ;
    }

    public enum DuplicationPolicy {
        /**
         * Overwrite the existing file
         */
        OVERWRITE,
        /**
         * Rename the file with a suffix
         */
        RENAME,
        /**
         * Skip the file
         */
        SKIP,
        /**
         * Calculate the hash of the file and compare with the existing file, if the hash is the same,
         * delete the original file and set the local path to the existing file, otherwise, move the file
         */
        HASH,
        ;
    }
}
