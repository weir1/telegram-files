package telegram.files;

import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import org.drinkless.tdlib.Client;
import org.drinkless.tdlib.TdApi;

import java.util.function.Consumer;

public class TelegramUpdateHandler implements Client.ResultHandler {

    private static final Log log = LogFactory.get();

    private Consumer<TdApi.AuthorizationState> onAuthorizationStateUpdated;

    private Consumer<TdApi.UpdateFile> onFileUpdated;

    private Consumer<TdApi.UpdateFileDownloads> onFileDownloadsUpdated;

    private Consumer<TdApi.Message> onMessageReceived;

    @Override
    public void onResult(TdApi.Object object) {
        switch (object.getConstructor()) {
            case TdApi.UpdateAuthorizationState.CONSTRUCTOR:
                if (onAuthorizationStateUpdated != null)
                    onAuthorizationStateUpdated.accept(((TdApi.UpdateAuthorizationState) object).authorizationState);
                break;
            case TdApi.UpdateFile.CONSTRUCTOR:
                if (onFileUpdated != null)
                    onFileUpdated.accept((TdApi.UpdateFile) object);
            case TdApi.UpdateFileDownload.CONSTRUCTOR:
                log.debug("File download update: %s".formatted(object));
                break;
            case TdApi.UpdateFileDownloads.CONSTRUCTOR:
                if (onFileDownloadsUpdated != null)
                    onFileDownloadsUpdated.accept((TdApi.UpdateFileDownloads) object);
                break;
            case TdApi.UpdateNewMessage.CONSTRUCTOR:
                if (onMessageReceived != null) {
                    onMessageReceived.accept(((TdApi.UpdateNewMessage) object).message);
                }
            default:
                log.trace("Unsupported telegram update: %s".formatted(object));
        }
    }

    public void setOnAuthorizationStateUpdated(Consumer<TdApi.AuthorizationState> onAuthorizationStateUpdated) {
        this.onAuthorizationStateUpdated = onAuthorizationStateUpdated;
    }

    public void setOnFileUpdated(Consumer<TdApi.UpdateFile> onFileUpdated) {
        this.onFileUpdated = onFileUpdated;
    }

    public void setOnFileDownloadsUpdated(Consumer<TdApi.UpdateFileDownloads> onFileDownloadsUpdated) {
        this.onFileDownloadsUpdated = onFileDownloadsUpdated;
    }

    public void setOnMessageReceived(Consumer<TdApi.Message> onMessageReceived) {
        this.onMessageReceived = onMessageReceived;
    }
}
