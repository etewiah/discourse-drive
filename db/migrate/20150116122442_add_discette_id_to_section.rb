class AddDiscetteIdToSection < ActiveRecord::Migration
  def change
    add_column :sections, :discette_id, :integer
    add_column :sections, :category_id, :integer
    add_column :sections, :user_count, :integer
  end
end
