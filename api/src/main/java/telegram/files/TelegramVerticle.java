package telegram.files;


import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.codec.Base64;
import cn.hutool.core.convert.Convert;
import cn.hutool.core.date.DateField;
import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateTime;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.core.util.TypeUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.*;
import io.vertx.core.impl.NoStackTraceException;
import io.vertx.core.json.Json;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.drinkless.tdlib.Client;
import org.drinkless.tdlib.TdApi;
import org.jooq.lambda.tuple.Tuple;
import org.jooq.lambda.tuple.Tuple2;
import telegram.files.repository.*;

import java.io.File;
import java.io.IOError;
import java.io.IOException;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class TelegramVerticle extends AbstractVerticle {

    private static final Log log = LogFactory.get();

    private Client client;

    private volatile String httpSessionId;

    public boolean authorized = false;

    public TdApi.AuthorizationState lastAuthorizationState;

    public String rootPath;

    private String proxyName;

    private String rootId;

    private boolean needDelete = false;

    public TelegramRecord telegramRecord;

    private final AvgSpeed avgSpeed = new AvgSpeed();

    static {
        Client.setLogMessageHandler(0, new LogMessageHandler());

        try {
            Client.execute(new TdApi.SetLogVerbosityLevel(Config.TELEGRAM_LOG_LEVEL));
            Client.execute(new TdApi.SetLogStream(new TdApi.LogStreamFile("tdlib.log", 1 << 27, false)));
        } catch (Client.ExecutionException error) {
            throw new IOError(new IOException("Write access to the current directory is required"));
        }
    }

    public TelegramVerticle(String rootPath) {
        this.rootPath = rootPath;
    }

    public TelegramVerticle(TelegramRecord telegramRecord) {
        this.telegramRecord = telegramRecord;
        this.rootPath = telegramRecord.rootPath();
        this.proxyName = telegramRecord.proxy();
    }

    public String getRootId() {
        if (StrUtil.isNotBlank(this.rootId)) return rootId;

        this.rootId = StrUtil.subAfter(this.rootPath, '-', true);
        return this.rootId;
    }

    public Object getId() {
        return telegramRecord == null ? this.getRootId() : telegramRecord.id();
    }

    public void setProxy(String proxyName) {
        this.proxyName = proxyName;
    }

    @Override
    public void start(Promise<Void> startPromise) {
        TelegramUpdateHandler telegramUpdateHandler = new TelegramUpdateHandler();
        telegramUpdateHandler.setOnAuthorizationStateUpdated(this::onAuthorizationStateUpdated);
        telegramUpdateHandler.setOnFileUpdated(this::onFileUpdated);
        telegramUpdateHandler.setOnFileDownloadsUpdated(this::onFileDownloadsUpdated);
        telegramUpdateHandler.setOnMessageReceived(this::onMessageReceived);
        client = Client.create(telegramUpdateHandler, this::handleException, this::handleException);
        vertx.setPeriodic(60 * 1000, id -> handleSaveAvgSpeed());
        this.enableProxy(this.proxyName)
                .onSuccess(r -> startPromise.complete())
                .onFailure(startPromise::fail);
    }

    @Override
    public void stop(Promise<Void> stopPromise) {
        this.close(false)
                .onComplete(stopPromise);
    }

    public Future<Void> close(boolean needDelete) {
        return this.execute(new TdApi.Close())
                .onSuccess(r -> {
                    log.info("[%s] Telegram account closed".formatted(this.getRootId()));
                    this.needDelete = needDelete;
                })
                .onFailure(e -> log.error("[%s] Failed to close telegram account: %s".formatted(this.getRootId(), e.getMessage())))
                .mapEmpty();
    }

    public boolean check() {
        if (StrUtil.isBlank(this.rootPath) || !FileUtil.exist(this.rootPath)) {
            log.error("[%s] Telegram account is invalid, root path: %s not exist.".formatted(this.getRootId(), this.rootPath));
            return false;
        }
        return true;
    }

    public void bindHttpSession(String httpSessionId) {
        this.httpSessionId = httpSessionId;
    }

    public Future<JsonObject> getTelegramAccount() {
        return Future.future(promise -> {
            if (!authorized) {
                JsonObject jsonObject = new JsonObject()
                        .put("id", this.getRootId())
                        .put("name", this.getRootId())
                        .put("phoneNumber", "")
                        .put("avatar", "")
                        .put("status", "inactive")
                        .put("rootPath", this.rootPath)
                        .put("isPremium", false)
                        .put("lastAuthorizationState", lastAuthorizationState)
                        .put("proxy", this.proxyName);
                if (this.telegramRecord != null) {
                    jsonObject.put("id", Convert.toStr(this.telegramRecord.id()))
                            .put("name", this.telegramRecord.firstName());
                }
                promise.complete(jsonObject);
                return;
            }
            this.execute(new TdApi.GetMe())
                    .onSuccess(user -> {
                        JsonObject result = new JsonObject()
                                .put("id", Convert.toStr(user.id))
                                .put("name", StrUtil.join(user.firstName, " ", user.lastName))
                                .put("phoneNumber", user.phoneNumber)
                                .put("avatar", Base64.encode((byte[]) BeanUtil.getProperty(user, "profilePhoto.minithumbnail.data")))
                                .put("status", "active")
                                .put("rootPath", this.rootPath)
                                .put("isPremium", user.isPremium)
                                .put("proxy", this.proxyName);
                        promise.complete(result);
                    })
                    .onFailure(e -> {
                        log.error("[%s] Failed to get telegram account: %s".formatted(this.getRootId(), e.getMessage()));
                        promise.fail(e);
                    });
        });
    }

    public Future<JsonArray> getChats(Long activatedChatId, String query) {
        Consumer<TdApi.Chats> insertActivatedChatId = chats -> {
            if (chats == null || ArrayUtil.isEmpty(chats.chatIds)) {
                return;
            }
            long[] chatIds = chats.chatIds;
            if (activatedChatId != null && !ArrayUtil.contains(chatIds, activatedChatId)) {
                chatIds = (long[]) ArrayUtil.insert(chatIds, 0, activatedChatId);
                chats.chatIds = chatIds;
            }
        };

        if (StrUtil.isBlank(query)) {
            return this.execute(new TdApi.GetChats(new TdApi.ChatListMain(), 10))
                    .map(chats -> {
                        insertActivatedChatId.accept(chats);
                        return chats;
                    })
                    .compose(chats -> Future.all(Arrays.stream(chats.chatIds)
                            .mapToObj(chatId -> this.execute(new TdApi.GetChat(chatId)))
                            .toList())
                    )
                    .map(CompositeFuture::<TdApi.Chat>list)
                    .compose(this::convertChat);
        } else {
            return this.execute(new TdApi.SearchChatsOnServer(query, 10))
                    .map(chats -> {
                        insertActivatedChatId.accept(chats);
                        return chats;
                    })
                    .compose(chats -> Future.all(Arrays.stream(chats.chatIds)
                            .mapToObj(chatId -> this.execute(new TdApi.GetChat(chatId)))
                            .toList())
                    )
                    .map(CompositeFuture::<TdApi.Chat>list)
                    .compose(this::convertChat);
        }
    }

    public Future<JsonObject> getChatFiles(long chatId, MultiMap filter) {
        String status = filter.get("status");
        if (Arrays.asList("downloading", "paused", "completed", "error").contains(status)) {
            return DataVerticle.fileRepository.getFiles(chatId, filter)
                    .compose(r -> {
                        long[] messageIds = r.v1.stream().mapToLong(FileRecord::messageId).toArray();
                        return this.execute(new TdApi.GetMessages(chatId, messageIds))
                                .map(m -> {
                                    Map<Long, TdApi.Message> messageMap = Arrays.stream(m.messages)
                                            .collect(Collectors.toMap(message -> message.id, Function.identity()));
                                    List<FileRecord> fileRecords = r.v1.stream()
                                            .map(fileRecord -> {
                                                TdApi.Message message = messageMap.get(fileRecord.messageId());
                                                FileRecord source = TdApiHelp.getFileHandler(message)
                                                        .map(fileHandler -> fileHandler.convertFileRecord(telegramRecord.id()))
                                                        .orElse(null);
                                                if (source != null) {
                                                    fileRecord = fileRecord.withSourceField(source.id(), source.downloadedSize());
                                                }
                                                return fileRecord;
                                            })
                                            .toList();
                                    return Tuple.tuple(fileRecords, r.v2, r.v3);
                                });
                    })
                    .map(tuple -> new JsonObject()
                            .put("files", tuple.v1)
                            .put("nextFromMessageId", tuple.v2)
                            .put("count", tuple.v3)
                            .put("size", tuple.v1.size())
                    );
        } else {
            TdApi.SearchChatMessages searchChatMessages = new TdApi.SearchChatMessages();
            searchChatMessages.chatId = chatId;
            searchChatMessages.query = filter.get("search");
            searchChatMessages.fromMessageId = Convert.toLong(filter.get("fromMessageId"), 0L);
            searchChatMessages.offset = Convert.toInt(filter.get("offset"), 0);
            searchChatMessages.limit = Convert.toInt(filter.get("limit"), 20);
            searchChatMessages.filter = TdApiHelp.getSearchMessagesFilter(filter.get("type"));

            return this.execute(searchChatMessages)
                    .compose(foundChatMessages ->
                            DataVerticle.fileRepository.getFilesByUniqueId(TdApiHelp.getFileUniqueIds(Arrays.asList(foundChatMessages.messages)))
                                    .map(fileRecords -> Tuple.tuple(foundChatMessages, fileRecords)))
                    .compose(r -> this.convertFiles(r, filter));
        }
    }

    public Future<JsonObject> getChatFilesCount(long chatId) {
        return Future.all(
                Stream.of(new TdApi.SearchMessagesFilterPhotoAndVideo(),
                                new TdApi.SearchMessagesFilterPhoto(),
                                new TdApi.SearchMessagesFilterVideo(),
                                new TdApi.SearchMessagesFilterAudio(),
                                new TdApi.SearchMessagesFilterDocument())
                        .map(filter -> this.execute(
                                                new TdApi.GetChatMessageCount(chatId,
                                                        filter,
                                                        0,
                                                        false)
                                        )
                                        .map(count -> new JsonObject()
                                                .put("type", TdApiHelp.getSearchMessagesFilterType(filter))
                                                .put("count", count.count)
                                        )
                        )
                        .toList()
        ).map(counts -> {
            JsonObject result = new JsonObject();
            counts.<JsonObject>list().forEach(count -> result.put(count.getString("type"), count.getInteger("count")));
            return result;
        });
    }

    public Future<Object> loadPreview(long chatId, long messageId) {
        return DataVerticle.settingRepository
                .getByKey(SettingKey.needToLoadImages)
                .compose(needToLoadImages -> {
                    if (!(boolean) needToLoadImages) {
                        return Future.failedFuture("Need to load images is disabled");
                    }
                    return this.execute(new TdApi.GetMessage(chatId, messageId));
                })
                .compose(message -> {
                    TdApiHelp.FileHandler<? extends TdApi.MessageContent> fileHandler = TdApiHelp.getFileHandler(message)
                            .orElseThrow(() -> new NoStackTraceException("not support message type"));

                    return DataVerticle.settingRepository.getByKey(SettingKey.imageLoadSize)
                            .map(size -> Tuple.tuple(message, fileHandler.getPreviewFileId(Tuple.tuple(size))));
                })
                .compose(tuple -> {
                    TdApi.Message message = tuple.v1;
                    TdApi.File file = tuple.v2;
                    if (file.local != null
                        && file.local.isDownloadingCompleted
                        && FileUtil.exist(file.local.path)) {
                        return Future.succeededFuture(file.local.path);
                    }

                    return savePreviewFile(message, file)
                            .compose(r -> {
                                TdApi.DownloadFile downloadFile = new TdApi.DownloadFile();
                                downloadFile.fileId = file.id;
                                downloadFile.priority = 32;
                                downloadFile.synchronous = true;

                                return this.execute(downloadFile)
                                        .map(file.id);
                            });
                });
    }

    private Future<Void> savePreviewFile(TdApi.Message message, TdApi.File file) {
        return Future.future(promise -> {
            if (TdApiHelp.getFileId(message) != file.id) {
                promise.complete();
            } else {
                DataVerticle.fileRepository.getByUniqueId(file.remote.uniqueId)
                        .onSuccess(fileRecord -> {
                            if (fileRecord != null) {
                                promise.complete();
                            } else {
                                DataVerticle.fileRepository.create(TdApiHelp.getFileHandler(message)
                                                .orElseThrow()
                                                .convertFileRecord(telegramRecord.id()))
                                        .onSuccess(r -> promise.complete())
                                        .onFailure(promise::fail);
                            }
                        })
                        .onFailure(promise::fail);
            }
        });
    }

    public Future<TdApi.File> startDownload(Long chatId, Long messageId, Integer fileId) {
        return Future.all(
                        this.execute(new TdApi.GetFile(fileId)),
                        this.execute(new TdApi.GetMessage(chatId, messageId))
                )
                .compose(results -> {
                    TdApi.File file = results.resultAt(0);
                    TdApi.Message message = results.resultAt(1);
                    if (file.local != null) {
                        if (file.local.isDownloadingCompleted) {
                            return Future.failedFuture("File already downloaded");
                        }
                        if (file.local.isDownloadingActive) {
                            return Future.failedFuture("File is downloading");
                        }
//                        return Future.failedFuture("Unknown file download status");
                    }

                    TdApiHelp.FileHandler<? extends TdApi.MessageContent> fileHandler = TdApiHelp.getFileHandler(message)
                            .orElseThrow(() -> new NoStackTraceException("not support message type"));
                    FileRecord fileRecord = fileHandler.convertFileRecord(telegramRecord.id());
                    return DataVerticle.fileRepository.create(fileRecord)
                            .compose(r ->
                                    this.execute(new TdApi.AddFileToDownloads(fileId, chatId, messageId, 32))
                            )
                            .onSuccess(r ->
                                    sendHttpEvent(EventPayload.build(EventPayload.TYPE_FILE_STATUS, new JsonObject()
                                            .put("fileId", fileId)
                                            .put("downloadStatus", FileRecord.DownloadStatus.downloading)
                                    ))
                            );
                });
    }

    public Future<Void> cancelDownload(Integer fileId) {
        return this.execute(new TdApi.GetFile(fileId))
                .compose(file -> DataVerticle.fileRepository
                        .updateFileId(file.id, file.remote.uniqueId)
                        .map(file)
                )
                .compose(file -> {
                    if (file.local == null) {
                        return Future.failedFuture("File not started downloading");
                    }

                    return this.execute(new TdApi.CancelDownloadFile(fileId, false))
                            .map(file);
                })
                .compose(file -> this.execute(new TdApi.DeleteFile(fileId)).map(file))
                .compose(file -> DataVerticle.fileRepository.deleteByUniqueId(file.remote.uniqueId))
                .onSuccess(r ->
                        sendHttpEvent(EventPayload.build(EventPayload.TYPE_FILE_STATUS, new JsonObject()
                                .put("fileId", fileId)
                                .put("downloadStatus", FileRecord.DownloadStatus.idle)
                        )))
                .mapEmpty();
    }

    public Future<Void> togglePauseDownload(Integer fileId, boolean isPaused) {
        return this.execute(new TdApi.GetFile(fileId))
                .compose(file -> DataVerticle.fileRepository
                        .updateFileId(file.id, file.remote.uniqueId)
                        .map(file)
                )
                .compose(file -> {
                    if (file.local == null) {
                        return Future.failedFuture("File not started downloading");
                    }
                    if (isPaused && !file.local.isDownloadingActive) {
                        return Future.failedFuture("File is not downloading");
                    }
                    if (!isPaused && file.local.isDownloadingActive) {
                        return Future.failedFuture("File is downloading");
                    }

                    return this.execute(new TdApi.ToggleDownloadIsPaused(fileId, isPaused));
                })
                .onSuccess(r ->
                        sendHttpEvent(EventPayload.build(EventPayload.TYPE_FILE_STATUS, new JsonObject()
                                .put("fileId", fileId)
                                .put("downloadStatus", isPaused ? FileRecord.DownloadStatus.paused : FileRecord.DownloadStatus.downloading)
                        )))
                .mapEmpty();
    }

    public Future<Void> toggleAutoDownload(Long chatId) {
        return DataVerticle.settingRepository.<SettingAutoRecords>getByKey(SettingKey.autoDownload)
                .compose(settingAutoRecords -> {
                    if (settingAutoRecords == null) {
                        settingAutoRecords = new SettingAutoRecords();
                    }
                    if (settingAutoRecords.exists(this.telegramRecord.id(), chatId)) {
                        settingAutoRecords.remove(this.telegramRecord.id(), chatId);
                    } else {
                        settingAutoRecords.add(this.telegramRecord.id(), chatId);
                    }
                    return DataVerticle.settingRepository.createOrUpdate(SettingKey.autoDownload.name(), Json.encode(settingAutoRecords));
                })
                .onSuccess(r -> vertx.eventBus().publish(EventEnum.AUTO_DOWNLOAD_UPDATE.name(), r.value()))
                .mapEmpty();
    }

    public Future<JsonObject> getDownloadStatistics() {
        return Future.all(DataVerticle.fileRepository.getDownloadStatistics(this.telegramRecord.id()),
                this.execute(new TdApi.GetNetworkStatistics())
        ).map(r -> {
            JsonObject jsonObject = r.resultAt(0);
            TdApi.NetworkStatistics networkStatistics = r.resultAt(1);
            Tuple2<Long, Long> bytes = Arrays.stream(networkStatistics.entries)
                    .filter(e -> e instanceof TdApi.NetworkStatisticsEntryFile)
                    .map(e -> {
                        TdApi.NetworkStatisticsEntryFile entry = (TdApi.NetworkStatisticsEntryFile) e;
                        return Tuple.tuple(entry.sentBytes, entry.receivedBytes);
                    })
                    .reduce((a, b) -> Tuple.tuple(a.v1 + b.v1, a.v2 + b.v2))
                    .orElse(Tuple.tuple(0L, 0L));

            jsonObject.put("networkStatistics", JsonObject.of()
                    .put("sinceDate", networkStatistics.sinceDate)
                    .put("sentBytes", bytes.v1)
                    .put("receivedBytes", bytes.v2)
            );

            jsonObject.put("speedStats", avgSpeed.getSpeedStats());
            return jsonObject;
        });
    }

    public Future<JsonObject> getDownloadStatisticsByPhase(Integer timeRange) {
        // 1: 1 hour, 2: 1 day, 3: 1 week, 4: 1 month
        long endTime = System.currentTimeMillis();
        long startTime = switch (timeRange) {
            case 1 -> DateUtil.offsetHour(DateUtil.date(), -1).getTime();
            case 2 -> DateUtil.offsetDay(DateUtil.date(), -1).getTime();
            case 3 -> DateUtil.offsetWeek(DateUtil.date(), -1).getTime();
            case 4 -> DateUtil.offsetMonth(DateUtil.date(), -1).getTime();
            default -> throw new IllegalStateException("Unexpected value: " + timeRange);
        };

        return Future.all(
                        DataVerticle.statisticRepository.getRangeStatistics(StatisticRecord.Type.speed, this.telegramRecord.id(), startTime, endTime)
                                .map(statisticRecords -> {
                                    TreeMap<String, List<JsonObject>> groupedSpeedStats = new TreeMap<>(Comparator.comparing(
                                            switch (timeRange) {
                                                case 1, 2 -> (Function<? super String, ? extends DateTime>) time ->
                                                        DateUtil.parse(time, DatePattern.NORM_DATETIME_MINUTE_FORMAT);
                                                case 3, 4 -> DateUtil::parseDate;
                                                default -> throw new IllegalStateException("Unexpected value: " + timeRange);
                                            }
                                    ));
                                    for (StatisticRecord record : statisticRecords) {
                                        JsonObject data = new JsonObject(record.data());
                                        long timestamp = record.timestamp();
                                        String time = switch (timeRange) {
                                            case 1 ->
                                                    MessyUtils.withGrouping5Minutes(DateUtil.toLocalDateTime(DateUtil.date(timestamp))).format(DatePattern.NORM_DATETIME_MINUTE_FORMATTER);
                                            case 2 ->
                                                    DateUtil.date(timestamp).setField(DateField.MINUTE, 0).toString(DatePattern.NORM_DATETIME_MINUTE_FORMAT);
                                            case 3, 4 ->
                                                    DateUtil.date(timestamp).setField(DateField.MINUTE, 0).toString(DatePattern.NORM_DATE_FORMAT);
                                            default -> throw new IllegalStateException("Unexpected value: " + timeRange);
                                        };
                                        groupedSpeedStats.computeIfAbsent(time, k -> new ArrayList<>()).add(data);
                                    }
                                    return groupedSpeedStats.entrySet().stream()
                                            .map(entry -> {
                                                JsonObject speedStat = entry.getValue().stream().reduce(new JsonObject()
                                                                .put("avgSpeed", 0)
                                                                .put("medianSpeed", 0)
                                                                .put("maxSpeed", 0)
                                                                .put("minSpeed", Long.MAX_VALUE),
                                                        (a, b) -> new JsonObject()
                                                                .put("avgSpeed", a.getLong("avgSpeed") + b.getLong("avgSpeed"))
                                                                .put("medianSpeed", a.getLong("medianSpeed") + b.getLong("medianSpeed"))
                                                                .put("maxSpeed", Math.max(a.getLong("maxSpeed"), b.getLong("maxSpeed")))
                                                                .put("minSpeed", Math.min(a.getLong("minSpeed"), b.getLong("minSpeed")))
                                                );
                                                int size = entry.getValue().size();
                                                speedStat.put("avgSpeed", speedStat.getLong("avgSpeed") / size)
                                                        .put("medianSpeed", speedStat.getLong("medianSpeed") / size);
                                                return new JsonObject()
                                                        .put("time", entry.getKey())
                                                        .put("data", speedStat);
                                            })
                                            .toList();
                                }),
                        DataVerticle.fileRepository.getCompletedRangeStatistics(this.telegramRecord.id(), startTime, endTime, timeRange)
                )
                .map(r -> new JsonObject()
                        .put("speedStats", r.resultAt(0))
                        .put("completedStats", r.resultAt(1))
                );
    }

    public Future<TdApi.Proxy> enableProxy(String proxyName) {
        if (StrUtil.isBlank(proxyName)) return Future.succeededFuture();
        return DataVerticle.settingRepository.<SettingProxyRecords>getByKey(SettingKey.proxys)
                .map(settingProxyRecords -> Optional.ofNullable(settingProxyRecords)
                        .flatMap(r -> r.getProxy(proxyName))
                        .orElseThrow(() -> new NoStackTraceException("Proxy %s not found".formatted(proxyName)))
                )
                .compose(proxy -> this.getTdProxy(proxy)
                        .map(r -> Tuple.tuple(proxy, r))
                )
                .compose(tuple -> {
                    SettingProxyRecords.Item proxy = tuple.v1;
                    TdApi.Proxy tdProxy = tuple.v2;
                    boolean edit = false;
                    if (tdProxy != null) {
                        if (tdProxy.isEnabled) {
                            return Future.succeededFuture(tdProxy);
                        }
                        edit = true;
                    }

                    TdApi.ProxyType proxyType;
                    if (Objects.equals(proxy.type, "http")) {
                        proxyType = new TdApi.ProxyTypeHttp(proxy.username, proxy.password, false);
                    } else if (Objects.equals(proxy.type, "socks5")) {
                        proxyType = new TdApi.ProxyTypeSocks5(proxy.username, proxy.password);
                    } else {
                        return Future.failedFuture("Unsupported proxy type: %s".formatted(proxy.type));
                    }
                    return edit ? this.execute(new TdApi.EditProxy(tdProxy.id, proxy.server, proxy.port, true, proxyType))
                            : this.execute(new TdApi.AddProxy(proxy.server, proxy.port, true, proxyType));
                })
                .compose(r -> DataVerticle.telegramRepository.update(this.telegramRecord.withProxy(proxyName)).map(r))
                .compose(r -> {
                    this.proxyName = proxyName;
                    return Future.succeededFuture(r);
                });
    }

    public Future<TdApi.Proxy> toggleProxy(JsonObject jsonObject) {
        String toggleProxyName = jsonObject.getString("proxyName");
        if (Objects.equals(toggleProxyName, this.proxyName)) {
            return Future.succeededFuture();
        }

        if (StrUtil.isBlank(toggleProxyName) && StrUtil.isNotBlank(this.proxyName)) {
            // disable proxy
            return this.execute(new TdApi.DisableProxy())
                    .compose(r -> DataVerticle.telegramRepository.update(this.telegramRecord.withProxy(null)))
                    .andThen(r -> {
                        this.proxyName = null;
                        this.telegramRecord = r.result();
                    })
                    .mapEmpty();
        } else {
            return this.enableProxy(toggleProxyName);
        }
    }

    public Future<TdApi.Proxy> getTdProxy(SettingProxyRecords.Item proxy) {
        return this.execute(new TdApi.GetProxies())
                .map(proxies -> Stream.of(proxies.proxies)
                        .filter(proxy::equalsTdProxy)
                        .findFirst()
                        .orElse(null));
    }

    public Future<TdApi.Proxy> getTdProxy() {
        return this.execute(new TdApi.GetProxies())
                .map(proxies -> Stream.of(proxies.proxies)
                        .filter(p -> p.isEnabled)
                        .findFirst()
                        .orElse(null));
    }

    public Future<Double> ping() {
        return this.getTdProxy()
                .compose(proxy -> this.execute(new TdApi.PingProxy(proxy == null ? 0 : proxy.id)))
                .map(r -> r.seconds);
    }

    @SuppressWarnings("unchecked")
    public <R extends TdApi.Object> Future<R> execute(TdApi.Function<R> method) {
        log.trace("[%s] Execute method: %s".formatted(getRootId(), TypeUtil.getTypeArgument(method.getClass())));
        return Future.future(promise -> {
            // if (!authorized) {
            //     promise.fail("Telegram account not found or not authorized");
            //     return;
            // }
            client.send(method, object -> {
                if (object.getConstructor() == TdApi.Error.CONSTRUCTOR) {
                    promise.fail("Execute method failed. " + object);
                } else {
                    promise.complete((R) object);
                }
            });
        });
    }

    public Future<String> execute(String method, Object params) {
        String code = RandomUtil.randomString(10);
        log.trace("[%s] Execute code: %s method: %s, params: %s".formatted(getRootId(), code, method, params));
        return Future.future(promise -> {
            TdApi.Function<?> func = TdApiHelp.getFunction(method, params);
            if (func == null) {
                promise.fail("Unsupported method: " + method);
                return;
            }
            client.send(func, object -> {
                log.debug("[%s] Execute: [%s] Receive result: %s".formatted(getRootId(), code, object));
                handleDefaultResult(object, code);
            });
            promise.complete(code);
        });
    }

    private void sendHttpEvent(EventPayload payload) {
        if (this.httpSessionId == null) return;

        String address = HttpVerticle.getWSHandlerId(httpSessionId);
        if (address == null) {
            log.debug("[%s] Can not found websocket textHandlerID for session id:%s".formatted(getRootId(), httpSessionId));
            return;
        }
        vertx.eventBus().send(address, Json.encode(payload));
    }

    private void handleAuthorizationResult(TdApi.Object object) {
        switch (object.getConstructor()) {
            case TdApi.Error.CONSTRUCTOR:
                sendHttpEvent(EventPayload.build(EventPayload.TYPE_ERROR, object));
                break;
            case TdApi.Ok.CONSTRUCTOR:
                break;
            default:
                log.warn("[%s] Receive UpdateAuthorizationState with invalid authorization state%s".formatted(getRootId(), object));
        }
    }

    private void handleDefaultResult(TdApi.Object object, String code) {
        if (object.getConstructor() == TdApi.Error.CONSTRUCTOR) {
            sendHttpEvent(EventPayload.build(EventPayload.TYPE_ERROR, code, object));
        } else {
            sendHttpEvent(EventPayload.build(EventPayload.TYPE_METHOD_RESULT, code, object));
        }
    }

    private void handleException(Throwable e) {
        log.error(e);
    }

    private void handleSaveAvgSpeed() {
        if (!authorized || telegramRecord == null) return;
        AvgSpeed.SpeedStats speedStats = avgSpeed.getSpeedStats();
        if (speedStats.avgSpeed() == 0
            && speedStats.minSpeed() == 0
            && speedStats.medianSpeed() == 0
            && speedStats.maxSpeed() == 0) {
            return;
        }
        JsonObject data = JsonObject.mapFrom(speedStats);
        data.remove("interval");
        DataVerticle.statisticRepository.create(new StatisticRecord(Convert.toStr(telegramRecord.id()),
                StatisticRecord.Type.speed,
                System.currentTimeMillis(),
                data.encode()));
    }

    private void onAuthorizationStateUpdated(TdApi.AuthorizationState authorizationState) {
        log.debug("[%s] Receive authorization state update: %s".formatted(getRootId(), authorizationState));
        this.lastAuthorizationState = authorizationState;
        switch (authorizationState.getConstructor()) {
            case TdApi.AuthorizationStateWaitTdlibParameters.CONSTRUCTOR:
                TdApi.SetTdlibParameters request = new TdApi.SetTdlibParameters();
                request.databaseDirectory = this.rootPath;
                request.useMessageDatabase = true;
                request.useFileDatabase = true;
                request.useChatInfoDatabase = true;
                request.useSecretChats = true;
                request.apiId = Config.TELEGRAM_API_ID;
                request.apiHash = Config.TELEGRAM_API_HASH;
                request.systemLanguageCode = "en";
                request.deviceModel = "Telegram Files";
                request.applicationVersion = Start.VERSION;
                log.trace("[%s] Send SetTdlibParameters: %s".formatted(getRootId(), request));

                client.send(request, this::handleAuthorizationResult);
                break;
            case TdApi.AuthorizationStateWaitPhoneNumber.CONSTRUCTOR:
            case TdApi.AuthorizationStateWaitOtherDeviceConfirmation.CONSTRUCTOR:
            case TdApi.AuthorizationStateWaitEmailAddress.CONSTRUCTOR:
            case TdApi.AuthorizationStateWaitEmailCode.CONSTRUCTOR:
            case TdApi.AuthorizationStateWaitCode.CONSTRUCTOR:
            case TdApi.AuthorizationStateWaitRegistration.CONSTRUCTOR:
            case TdApi.AuthorizationStateWaitPassword.CONSTRUCTOR:
                sendHttpEvent(EventPayload.build(EventPayload.TYPE_AUTHORIZATION, authorizationState));
                break;
            case TdApi.AuthorizationStateReady.CONSTRUCTOR:
                authorized = true;
                if (telegramRecord == null) {
                    this.execute(new TdApi.GetMe())
                            .compose(user ->
                                    DataVerticle.telegramRepository.create(new TelegramRecord(user.id, user.firstName, this.rootPath, this.proxyName))
                            )
                            .compose(record -> {
                                telegramRecord = record;
                                return this.execute(new TdApi.LoadChats(new TdApi.ChatListMain(), 10));
                            })
                            .onSuccess(o -> log.info("[%s] %s Authorization Ready".formatted(getRootId(), this.telegramRecord.firstName())))
                            .onFailure(e -> log.error("[%s] Authorization Ready, but failed to create telegram record: %s".formatted(getRootId(), e.getMessage())));
                } else {
                    log.info("[%s] %s Authorization Ready".formatted(getRootId(), this.telegramRecord.firstName()));
                }
                sendHttpEvent(EventPayload.build(EventPayload.TYPE_AUTHORIZATION, authorizationState));
                break;
            case TdApi.AuthorizationStateLoggingOut.CONSTRUCTOR:
                break;
            case TdApi.AuthorizationStateClosing.CONSTRUCTOR:
                break;
            case TdApi.AuthorizationStateClosed.CONSTRUCTOR:
                if (needDelete) {
                    File root = FileUtil.file(this.rootPath);
                    if (root.exists()) {
                        FileUtil.del(root);
                    }
                    log.info("[%s] Telegram account deleted".formatted(this.getRootId()));
                }
                break;
            default:
                log.warn("[%s] Unsupported authorization state received:%s".formatted(this.getRootId(), authorizationState));
        }
    }

    private void onFileUpdated(TdApi.UpdateFile updateFile) {
        log.trace("[%s] Receive file update: %s".formatted(getRootId(), updateFile));
        TdApi.File file = updateFile.file;
        if (file != null) {
            String localPath = null;
            Long completionDate = null;
            if (file.local != null && file.local.isDownloadingCompleted) {
                localPath = file.local.path;
                completionDate = System.currentTimeMillis();
            }
            FileRecord.DownloadStatus downloadStatus = TdApiHelp.getDownloadStatus(file);
            DataVerticle.fileRepository.updateStatus(file.id,
                            file.remote.uniqueId,
                            localPath,
                            downloadStatus,
                            completionDate)
                    .onSuccess(r -> {
                        if (r == null || r.isEmpty()) return;
                        sendHttpEvent(EventPayload.build(EventPayload.TYPE_FILE_STATUS, new JsonObject()
                                .put("fileId", file.id)
                                .put("downloadStatus", r.getString("downloadStatus"))
                                .put("localPath", r.getString("localPath"))
                                .put("completionDate", r.getLong("completionDate"))
                        ));
                    });
        }
        sendHttpEvent(EventPayload.build(EventPayload.TYPE_FILE, updateFile));
    }

    private void onFileDownloadsUpdated(TdApi.UpdateFileDownloads updateFileDownloads) {
        log.trace("[%s] Receive file downloads update: %s".formatted(getRootId(), updateFileDownloads));
        avgSpeed.update(updateFileDownloads.downloadedSize, System.currentTimeMillis());
        sendHttpEvent(EventPayload.build(EventPayload.TYPE_FILE_DOWNLOAD, updateFileDownloads));
    }

    private void onMessageReceived(TdApi.Message message) {
        log.trace("[%s] Receive message: %s".formatted(getRootId(), message));
        vertx.eventBus().publish(EventEnum.MESSAGE_RECEIVED.address(), JsonObject.of()
                .put("telegramId", telegramRecord.id())
                .put("chatId", message.chatId)
                .put("messageId", message.id)
        );
    }

    private static class LogMessageHandler implements Client.LogMessageHandler {

        @Override
        public void onLogMessage(int verbosityLevel, String message) {
            log.debug("TDLib: %s".formatted(message));
        }
    }

    //<-----------------------------convert---------------------------------->

    private Future<JsonArray> convertChat(List<TdApi.Chat> chats) {
        return DataVerticle.settingRepository.<SettingAutoRecords>getByKey(SettingKey.autoDownload)
                .map(settingAutoRecords -> settingAutoRecords == null ? Collections.emptySet()
                        : settingAutoRecords.getChatIds(this.telegramRecord.id()))
                .map(enableAutoChatIds -> new JsonArray(chats.stream()
                        .map(chat -> new JsonObject()
                                .put("id", Convert.toStr(chat.id))
                                .put("name", chat.id == this.telegramRecord.id() ? "Saved Messages" : chat.title)
                                .put("type", TdApiHelp.getChatType(chat.type))
                                .put("avatar", Base64.encode((byte[]) BeanUtil.getProperty(chat, "photo.minithumbnail.data")))
                                .put("unreadCount", chat.unreadCount)
                                .put("lastMessage", "")
                                .put("lastMessageTime", "")
                                .put("autoEnabled", enableAutoChatIds.contains(chat.id))
                        )
                        .toList()
                ));
    }

    private Future<JsonObject> convertFiles(Tuple2<TdApi.FoundChatMessages, Map<String, FileRecord>> tuple, MultiMap filter) {
        TdApi.FoundChatMessages foundChatMessages = tuple.v1;
        Map<String, FileRecord> fileRecords = tuple.v2;
        boolean searchIdle = Objects.equals(filter.get("status"), FileRecord.DownloadStatus.idle.name());

        return DataVerticle.settingRepository.<Boolean>getByKey(SettingKey.uniqueOnly)
                .map(uniqueOnly -> {
                    if (!uniqueOnly) {
                        return Arrays.asList(foundChatMessages.messages);
                    }
                    return TdApiHelp.filterUniqueMessages(Arrays.asList(foundChatMessages.messages));
                })
                .map(messages -> {
                    List<JsonObject> fileObjects = messages.stream()
                            .filter(message -> TdApiHelp.FILE_CONTENT_CONSTRUCTORS.contains(message.content.getConstructor()))
                            .map(message -> {
                                FileRecord source = TdApiHelp.getFileHandler(message)
                                        .map(fileHandler -> fileHandler.convertFileRecord(telegramRecord.id()))
                                        .orElse(null);
                                if (source == null) {
                                    return null;
                                }
                                FileRecord fileRecord = fileRecords.get(TdApiHelp.getFileUniqueId(message));
                                if (fileRecord == null) {
                                    fileRecord = source;
                                } else {
                                    fileRecord = fileRecord.withSourceField(source.id(), source.downloadedSize());
                                }
                                if (searchIdle && !Objects.equals(fileRecord.downloadStatus(), FileRecord.DownloadStatus.idle.name())) {
                                    return null;
                                }

                                //TODO Processing of the same file under different accounts

                                JsonObject fileObject = JsonObject.mapFrom(fileRecord);
                                fileObject.put("formatDate", DateUtil.date(fileObject.getLong("date") * 1000).toString());
                                return fileObject;
                            })
                            .filter(Objects::nonNull)
                            .toList();
                    return new JsonObject()
                            .put("files", new JsonArray(fileObjects))
                            .put("count", foundChatMessages.totalCount)
                            .put("size", fileObjects.size())
                            .put("nextFromMessageId", foundChatMessages.nextFromMessageId);
                });

    }
}
