create sequence access_tokens_id_seq;
create table access_tokens (
  id          integer not null primary key default nextval('access_tokens_id_seq'),
  identity_id integer not null,
  access_key  varchar(40) not null,
  secret_key  varchar(40) not null,
  expire_at   timestamp with time zone,
  created_at  timestamp with time zone default current_timestamp,
  updated_at  timestamp with time zone default current_timestamp
);

alter sequence access_tokens_id_seq owned by access_tokens.id;
create unique index access_tokens_access_key_idx on access_tokens (access_key);
create index access_tokens_identity_id_idx on access_tokens (identity_id);
