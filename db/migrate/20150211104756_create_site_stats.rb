class CreateSiteStats < ActiveRecord::Migration
  def change
    create_table :site_stats do |t|
      t.integer :site_id
      t.string :site_slug
      t.datetime :gathered_at
      t.text :data
      t.timestamps
    end
  end
end
