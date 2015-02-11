class AddTagsToDiscourseSites < ActiveRecord::Migration
  def change
    add_column :discourse_sites, :tags, :string
    # below for https://github.com/pboling/flag_shih_tzu
    add_column :discourse_sites, :status, :integer, null: false, default: 0
    add_column :discourse_sites, :topic_id, :integer
    add_column :discourse_sites, :user_id, :integer
    add_column :discourse_sites, :listed, :boolean
    add_column :discourse_sites, :visible, :boolean
    add_column :discourse_sites, :popularity, :string
    change_table(:discourse_sites) { |t| t.timestamps }
  end
end
