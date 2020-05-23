-- User identities
create sequence user_identities_id_seq;
create table user_identities (
  id         integer not null primary key default nextval('user_identities_id_seq'),
  uuid       varchar(36) not null,
  username   varchar(255) not null,
  email      varchar(255),
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

alter sequence user_identities_id_seq owned by user_identities.id;
create unique index user_identities_uuid_idx on user_identities (uuid);
create unique index user_identities_username_idx on user_identities (username);
create index user_identities_email_idx on user_identities (email);

-- User accounts
create sequence user_accounts_id_seq;
create table user_accounts (
  id          integer not null primary key default nextval('user_accounts_id_seq'),
  provider    varchar(20) not null,
  provider_id varchar(255) not null,
  identity_id integer not null,
  created_at  timestamp with time zone default current_timestamp,
  updated_at  timestamp with time zone default current_timestamp
);

alter sequence user_accounts_id_seq owned by user_accounts.id;
create unique index user_accounts_provider_id_idx on user_accounts (provider, provider_id);
create index user_accounts_identity_id_idx on user_accounts (identity_id);
