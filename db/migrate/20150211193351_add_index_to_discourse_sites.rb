class AddIndexToDiscourseSites < ActiveRecord::Migration
  def change
    add_index :discourse_sites, :slug, :unique => true
  end
end
