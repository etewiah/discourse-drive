class AddTagLineToSections < ActiveRecord::Migration
  def change
    add_column :sections, :tag_line, :string
    add_column :sections, :description, :text
    change_table(:sections) { |t| t.timestamps }
  end
end
