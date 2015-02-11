class CreateTopicBuckets < ActiveRecord::Migration
  def change
    create_table :topic_buckets do |t|
      t.string :name
      t.string :tag_line
      t.text :description
      t.text :data
    end
  end
end
