package telegram.files;

import org.drinkless.tdlib.TdApi;

public class TelegramRunException extends RuntimeException {
    private final TdApi.Error error;

    public TelegramRunException(TdApi.Error error) {
        super(error.message);
        this.error = error;
    }

    public TdApi.Error getError() {
        return error;
    }
}
