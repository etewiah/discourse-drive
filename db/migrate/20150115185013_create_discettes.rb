class CreateDiscettes < ActiveRecord::Migration
  def change
    create_table :discettes do |t|
      t.string :name
      t.string :slug
      t.text :description
      t.text :meta
    end
  end
end
