package telegram.files.repository.impl;


import io.vertx.sqlclient.SqlClient;

public abstract class AbstractSqlRepository {

    protected final SqlClient sqlClient;

    public AbstractSqlRepository(SqlClient sqlClient) {
        this.sqlClient = sqlClient;
    }

}
