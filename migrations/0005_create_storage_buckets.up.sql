begin;

create sequence storage_buckets_id_seq;
create table storage_buckets (
  id         integer not null primary key default nextval('storage_buckets_id_seq'),
  owner_id   integer not null,
  name       varchar(255) not null,
  is_public  boolean not null default false,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

alter sequence storage_buckets_id_seq owned by storage_buckets.id;
create unique index storage_buckets_name on storage_buckets (name);
create index storage_buckets_owner_id on storage_buckets (owner_id);

commit;
