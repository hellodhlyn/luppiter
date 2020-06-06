create sequence applications_id_seq;
create table applications (
  id          integer not null primary key default nextval('applications_id_seq'),
  uuid        varchar(36) not null,
  name        varchar(255) not null,
  owner_id    integer not null,
  created_at  timestamp with time zone default current_timestamp,
  updated_at  timestamp with time zone default current_timestamp
);

alter sequence applications_id_seq owned by applications.id;
create unique index applications_uuid_idx on applications (uuid);
create unique index applications_name_idx on applications (name);
create index applications_owner_id_idx on applications (owner_id);
