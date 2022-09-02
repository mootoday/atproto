import { AdxUri } from '@adxp/common'
import * as microblog from '@adxp/microblog'
import { Repost } from '@adxp/microblog'
import {
  DataSource,
  Entity,
  Column,
  PrimaryColumn,
  Repository,
  In,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'
import { DbRecordPlugin } from '../types'
import { UserDid } from '../user-dids'
import { collectionToTableName } from '../util'
import { PostIndex } from './post'

const collection = 'bsky/reposts'
const tableName = collectionToTableName(collection)

@Entity({ name: tableName })
export class RepostIndex {
  @PrimaryColumn('varchar')
  uri: string

  @Column('varchar')
  @ManyToOne(() => UserDid, (user) => user.did)
  creator: string

  @Column('varchar')
  @ManyToOne(() => PostIndex, (post) => post.uri)
  subject: string

  @Column('datetime')
  createdAt: string

  @UpdateDateColumn()
  indexedAt: Date
}

const getFn =
  (repo: Repository<RepostIndex>) =>
  async (uri: AdxUri): Promise<Repost.Record | null> => {
    const found = await repo.findOneBy({ uri: uri.toString() })
    return found === null ? null : translateDbObj(found)
  }

const getManyFn =
  (repo: Repository<RepostIndex>) =>
  async (uris: AdxUri[] | string[]): Promise<Repost.Record[]> => {
    const uriStrs = uris.map((u) => u.toString())
    const found = await repo.findBy({ uri: In(uriStrs) })
    return found.map(translateDbObj)
  }

const setFn =
  (repo: Repository<RepostIndex>) =>
  async (uri: AdxUri, obj: unknown): Promise<void> => {
    if (!microblog.isRepost(obj)) {
      throw new Error('Not a valid repost record')
    }
    const repost = new RepostIndex()
    repost.uri = uri.toString()
    repost.creator = uri.host
    repost.subject = obj.subject
    repost.createdAt = obj.createdAt

    await repo.save(repost)
  }

const deleteFn =
  (repo: Repository<RepostIndex>) =>
  async (uri: AdxUri): Promise<void> => {
    await repo.delete({ uri: uri.toString() })
  }

const translateDbObj = (dbObj: RepostIndex): Repost.Record => {
  return {
    subject: dbObj.subject,
    createdAt: dbObj.createdAt,
  }
}

export const makePlugin = (
  db: DataSource,
): DbRecordPlugin<Repost.Record, RepostIndex> => {
  const repository = db.getRepository(RepostIndex)
  return {
    collection,
    tableName,
    get: getFn(repository),
    getMany: getManyFn(repository),
    set: setFn(repository),
    delete: deleteFn(repository),
    translateDbObj,
  }
}

export default makePlugin
